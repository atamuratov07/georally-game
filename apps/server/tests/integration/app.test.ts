import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { DEFAULT_GAME_CONFIG } from '@georally/game-domain/multiplayer'
import type {
	CreateRoomResponse,
	HostRoomSnapshotEvent,
	PlayerRoomSnapshotEvent,
	RoomClosedEvent,
} from '@georally/game-protocol'

import { parseEnv } from '../../src/config/env'
import { bootstrapServer, type RoomClientSocket } from '../setup'

type TestServer = Awaited<ReturnType<typeof bootstrapServer>>

describe('multiplayer server integration', () => {
	let server: TestServer

	beforeAll(async () => {
		server = await bootstrapServer()
	})

	afterEach(() => {
		server.resetBetweenTests()
	})

	afterAll(async () => {
		await server.teardown()
	})

	async function postRoom(): Promise<CreateRoomResponse> {
		const response = await request(server.httpServer)
			.post('/api/rooms')
			.send({ hostName: 'Alice', roomMode: 'classroom' })
			.expect(201)

		return response.body.data
	}

	async function joinAsPlayer(roomCode: string, memberName: string) {
		const playerSocket = await server.connectClient()
		const joined = await playerSocket.emitWithAck('room:join', {
			roomCode,
			memberName,
		})
		if (!joined.ok) throw new Error('setup failed')

		return { playerSocket, joined: joined.data }
	}

	function nextHostSnapshot(socket: RoomClientSocket) {
		return new Promise<HostRoomSnapshotEvent>(resolve => {
			socket.once('room:host-snapshot', resolve)
		})
	}

	function nextPlayerSnapshot(socket: RoomClientSocket) {
		return new Promise<PlayerRoomSnapshotEvent>(resolve => {
			socket.once('room:player-snapshot', resolve)
		})
	}

	describe('GET /health', () => {
		it('reports zero rooms and sessions when empty', async () => {
			const response = await request(server.httpServer)
				.get('/health')
				.expect(200)

			expect(response.body).toMatchObject({
				roomCount: 0,
				connectedSessionCount: 0,
			})
		})

		it('reflects rooms and sessions after they were created', async () => {
			const { created } = await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'classroom',
			})
			await joinAsPlayer(created.roomCode, 'Bob')

			const response = await request(server.httpServer)
				.get('/health')
				.expect(200)

			expect(response.body).toMatchObject({
				roomCount: 1,
				connectedSessionCount: 2,
			})
		})
	})

	describe('POST /api/rooms', () => {
		it('creates a room and returns only the session identity', async () => {
			const response = await request(server.httpServer)
				.post('/api/rooms')
				.send({ hostName: 'Alice', roomMode: 'classroom' })
				.expect(201)

			expect(response.body).toMatchObject({
				ok: true,
				data: {
					role: 'host',
					roomCode: expect.stringMatching(/^[A-Z0-9]{6}$/),
					memberId: expect.any(String),
					memberSessionToken: expect.any(String),
				},
			})
			expect(response.body.data).not.toHaveProperty('snapshot')
		})

		it('does not bind any socket to the new session', async () => {
			await postRoom()

			const response = await request(server.httpServer)
				.get('/health')
				.expect(200)

			expect(response.body).toMatchObject({
				roomCount: 1,
				connectedSessionCount: 0,
			})
		})

		it('rejects an invalid payload', async () => {
			const response = await request(server.httpServer)
				.post('/api/rooms')
				.send({ hostName: '', roomMode: 'party' })
				.expect(400)

			expect(response.body).toEqual({
				ok: false,
				error: { code: 'invalid_payload' },
			})
		})

		it('rejects malformed JSON with an ack body, not an HTML page', async () => {
			const response = await request(server.httpServer)
				.post('/api/rooms')
				.set('Content-Type', 'application/json')
				.send('{bad')
				.expect(400)

			expect(response.body).toEqual({
				ok: false,
				error: { code: 'invalid_payload' },
			})
		})

		it('answers the CORS preflight for an allowed origin', async () => {
			const [origin] = parseEnv(process.env).corsOrigins

			const response = await request(server.httpServer)
				.options('/api/rooms')
				.set('Origin', origin)
				.set('Access-Control-Request-Method', 'POST')
				.set('Access-Control-Request-Headers', 'content-type')
				.expect(204)

			expect(response.headers['access-control-allow-origin']).toBe(origin)
		})
	})

	describe('host handoff from HTTP to socket', () => {
		it('lets the host resume the created room', async () => {
			const created = await postRoom()

			const hostSocket = await server.connectClient()
			const resumed = await hostSocket.emitWithAck('room:host-resume', {
				memberSessionToken: created.memberSessionToken,
			})

			expect(resumed.ok).toBe(true)
			if (!resumed.ok) return

			expect(resumed.data.memberId).toBe(created.memberId)
			expect(resumed.data.snapshot.members).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						memberId: created.memberId,
						connected: true,
					}),
				]),
			)

			const health = await request(server.httpServer)
				.get('/health')
				.expect(200)
			expect(health.body).toMatchObject({ connectedSessionCount: 1 })
		})

		it('shows players a disconnected host until the host resumes', async () => {
			const created = await postRoom()
			const { playerSocket, joined } = await joinAsPlayer(
				created.roomCode,
				'Bob',
			)

			expect(joined.snapshot.members).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						memberId: created.memberId,
						connected: false,
					}),
				]),
			)

			const playerSnapshotPromise = nextPlayerSnapshot(playerSocket)

			const hostSocket = await server.connectClient()
			const resumed = await hostSocket.emitWithAck('room:host-resume', {
				memberSessionToken: created.memberSessionToken,
			})
			if (!resumed.ok) throw new Error('setup failed')

			const playerSnapshotEvent = await playerSnapshotPromise
			expect(playerSnapshotEvent.snapshot.members).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						memberId: created.memberId,
						connected: true,
					}),
				]),
			)
		})
	})

	describe('authentication guard', () => {
		it('rejects game actions from a socket that never joined or resumed a room', async () => {
			const strangerSocket = await server.connectClient()

			const response = await strangerSocket.emitWithAck(
				'game:submit-answer',
				{ countryId: '840' },
			)

			expect(response.ok).toBe(false)
			if (response.ok) return
			expect(response.error).toMatchObject({ code: 'unauthorized' })
		})

		it('rejects a second join from a socket that already joined', async () => {
			const { created } = await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'classroom',
			})
			const { playerSocket } = await joinAsPlayer(created.roomCode, 'Bob')

			const joinedAgain = await playerSocket.emitWithAck('room:join', {
				roomCode: created.roomCode,
				memberName: 'Tom',
			})

			expect(joinedAgain.ok).toBe(false)
			if (joinedAgain.ok) return
			expect(joinedAgain.error.code).toBe('unauthorized')
		})

		it('lets a bound socket resume its own session again', async () => {
			const { hostSocket, created } = await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'classroom',
			})

			const resumed = await hostSocket.emitWithAck('room:host-resume', {
				memberSessionToken: created.memberSessionToken,
			})

			expect(resumed.ok).toBe(true)
		})

		// Requires the resume guard in socket.ts.
		it("rejects resuming another member's session on a socket that is already bound", async () => {
			const { created: firstRoom } = await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'group',
			})
			const { hostSocket: secondHostSocket } = await server.createRoomAsHost(
				{
					hostName: 'Steve',
					roomMode: 'classroom',
				},
			)

			const resumed = await secondHostSocket.emitWithAck(
				'room:host-resume',
				{
					memberSessionToken: firstRoom.memberSessionToken,
				},
			)

			expect(resumed.ok).toBe(false)
			if (resumed.ok) return
			expect(resumed.error.code).toBe('unauthorized')
		})
	})

	describe('event broadcast', () => {
		it("notifies the host's socket when a player joins", async () => {
			const { hostSocket, created } = await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'classroom',
			})

			const hostSnapshotPromise = nextHostSnapshot(hostSocket)

			await joinAsPlayer(created.roomCode, 'Bob')

			const hostSnapshotEvent = await hostSnapshotPromise
			const memberNames = hostSnapshotEvent.snapshot.members.map(
				member => member.name,
			)
			expect(memberNames).toEqual(['Alice', 'Bob'])
		})

		it("notifies the player's socket when the host terminates", async () => {
			const { hostSocket, created } = await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'classroom',
			})
			const { playerSocket } = await joinAsPlayer(created.roomCode, 'Bob')

			const playerClosedPromise = new Promise<RoomClosedEvent>(resolve => {
				playerSocket.once('room:closed', resolve)
			})

			const closed = await hostSocket.emitWithAck('room:terminate', {})
			if (!closed.ok) throw new Error('setup failed')

			const playerClosedEvent = await playerClosedPromise
			expect(playerClosedEvent.reason).toBe('host_terminated')
		})
	})

	describe('reconnection flow', () => {
		it('notifies all connected players when the host disconnects', async () => {
			const { hostSocket, created } = await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'classroom',
			})
			const { playerSocket, joined } = await joinAsPlayer(
				created.roomCode,
				'Bob',
			)

			expect(joined.snapshot.members).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						memberId: created.memberId,
						connected: true,
					}),
				]),
			)

			const playerSnapshotPromise = nextPlayerSnapshot(playerSocket)

			hostSocket.disconnect()

			const playerSnapshotEvent = await playerSnapshotPromise
			expect(playerSnapshotEvent.snapshot.members).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						memberId: created.memberId,
						connected: false,
					}),
				]),
			)
		})

		it('notifies all connected players when the host reconnects', async () => {
			const { hostSocket, created } = await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'classroom',
			})
			const { playerSocket } = await joinAsPlayer(created.roomCode, 'Bob')

			const playerSnapshotOnDisconnectPromise =
				nextPlayerSnapshot(playerSocket)

			hostSocket.close()

			const playerSnapshotOnDisconnectEvent =
				await playerSnapshotOnDisconnectPromise
			const hostMember =
				playerSnapshotOnDisconnectEvent.snapshot.members.find(
					member => member.memberId === created.memberId,
				)
			if (hostMember?.connected) throw new Error('setup failed')

			const playerSnapshotOnResumePromise = nextPlayerSnapshot(playerSocket)

			const newHostSocket = await server.connectClient()
			const resumed = await newHostSocket.emitWithAck('room:host-resume', {
				memberSessionToken: created.memberSessionToken,
			})
			if (!resumed.ok) throw new Error('setup failed')

			const playerSnapshotOnResumeEvent = await playerSnapshotOnResumePromise
			expect(playerSnapshotOnResumeEvent.snapshot.members).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						memberId: resumed.data.memberId,
						connected: true,
					}),
				]),
			)
		})

		it('evicts the socket when another socket resumes the same session', async () => {
			const { hostSocket, created } = await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'classroom',
			})

			const hostDisconnectPromise = new Promise<string>(resolve => {
				hostSocket.once('disconnect', resolve)
			})

			const newHostSocket = await server.connectClient()
			const resumed = await newHostSocket.emitWithAck('room:host-resume', {
				memberSessionToken: created.memberSessionToken,
			})
			if (!resumed.ok) throw new Error('setup failed')

			const hostDisconnectReason = await hostDisconnectPromise
			expect(hostDisconnectReason).toBe('io server disconnect')
		})
	})

	describe('per-role visibility split', () => {
		it('reaches the right socket', async () => {
			const { hostSocket, created } = await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'classroom',
			})
			const { playerSocket, joined } = await joinAsPlayer(
				created.roomCode,
				'Bob',
			)

			// Listen before emitting: the player's start snapshot travels on a
			// different connection and can arrive after the host's ack resolves.
			const playerStartedPromise = nextPlayerSnapshot(playerSocket)

			const started = await hostSocket.emitWithAck('game:start', {
				gameConfig: DEFAULT_GAME_CONFIG,
			})
			if (!started.ok) throw new Error('setup failed')

			await playerStartedPromise

			const hostSnapshotPromise = nextHostSnapshot(hostSocket)
			const playerSnapshotPromise = nextPlayerSnapshot(playerSocket)

			const revealed = await hostSocket.emitWithAck('game:reveal-round', {})
			if (!revealed.ok) throw new Error('setup failed')

			const hostSnapshotEvent = await hostSnapshotPromise

			expect(hostSnapshotEvent.snapshot.viewerRole).toBe('host')

			expect(hostSnapshotEvent.snapshot.roomMode).toBe('classroom')
			if (hostSnapshotEvent.snapshot.roomMode !== 'classroom') return

			expect(hostSnapshotEvent.snapshot.phase).toBe('active')
			if (hostSnapshotEvent.snapshot.phase !== 'active') return

			expect(hostSnapshotEvent.snapshot.activeGame.phase).toBe('revealed')
			if (hostSnapshotEvent.snapshot.activeGame.phase !== 'revealed') return

			expect(hostSnapshotEvent.snapshot.activeGame.participants).toEqual(
				expect.arrayContaining([
					{
						participantId: joined.memberId,
						rank: 1,
						score: 0,
						correctCount: 0,
						submission: {
							countryId: null,
							isCorrect: false,
							scoreAwarded: 0,
							submittedAt: null,
						},
					},
				]),
			)

			const playerSnapshotEvent = await playerSnapshotPromise

			expect(playerSnapshotEvent.snapshot.viewerRole).toBe('player')

			expect(playerSnapshotEvent.snapshot.roomMode).toBe('classroom')
			if (playerSnapshotEvent.snapshot.roomMode !== 'classroom') return

			expect(playerSnapshotEvent.snapshot.phase).toBe('active')
			if (playerSnapshotEvent.snapshot.phase !== 'active') return

			expect(playerSnapshotEvent.snapshot.activeGame.phase).toBe('revealed')
			if (playerSnapshotEvent.snapshot.activeGame.phase !== 'revealed')
				return

			expect(playerSnapshotEvent.snapshot.activeGame).not.toHaveProperty(
				'participants',
			)
			expect(
				playerSnapshotEvent.snapshot.activeGame.viewerSubmission,
			).toMatchObject({
				countryId: null,
				isCorrect: false,
				scoreAwarded: 0,
				submittedAt: null,
			})
		})
	})
})
