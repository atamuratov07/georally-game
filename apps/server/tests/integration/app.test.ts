import request from 'supertest'
import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	vi,
} from 'vitest'
import { DEFAULT_GAME_CONFIG } from '@georally/game-domain/multiplayer'
import {
	toHostRoomView,
	toPlayerRoomView,
} from '@georally/game-domain/multiplayer/room'
import type {
	CreateRoomResponse,
	RoomClosedEvent,
	RoomUpdateEvent,
} from '@georally/game-protocol'

import { parseEnv } from '../../src/config/env'
import { trackRoomClient, type TrackedRoomClient } from '../roomClient'
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

	function nextUpdate(socket: RoomClientSocket) {
		return new Promise<RoomUpdateEvent>(resolve => {
			socket.once('room:update', resolve)
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
			expect(resumed.data.sync.members).toEqual(
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

			expect(joined.sync.members).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						memberId: created.memberId,
						connected: false,
					}),
				]),
			)

			const playerUpdatePromise = nextUpdate(playerSocket)

			const hostSocket = await server.connectClient()
			const resumed = await hostSocket.emitWithAck('room:host-resume', {
				memberSessionToken: created.memberSessionToken,
			})
			if (!resumed.ok) throw new Error('setup failed')

			const playerUpdate = await playerUpdatePromise
			expect(playerUpdate.members).toEqual(
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

			const hostUpdatePromise = nextUpdate(hostSocket)

			await joinAsPlayer(created.roomCode, 'Bob')

			const hostUpdate = await hostUpdatePromise
			const memberNames = hostUpdate.members?.map(member => member.name)
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

			expect(joined.sync.members).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						memberId: created.memberId,
						connected: true,
					}),
				]),
			)

			const playerUpdatePromise = nextUpdate(playerSocket)

			hostSocket.disconnect()

			const playerUpdate = await playerUpdatePromise
			expect(playerUpdate.members).toEqual(
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

			const playerUpdateOnDisconnectPromise = nextUpdate(playerSocket)

			hostSocket.close()

			const playerUpdateOnDisconnect = await playerUpdateOnDisconnectPromise
			const hostMember = playerUpdateOnDisconnect.members?.find(
				member => member.memberId === created.memberId,
			)
			if (hostMember?.connected !== false) throw new Error('setup failed')

			const playerUpdateOnResumePromise = nextUpdate(playerSocket)

			const newHostSocket = await server.connectClient()
			const resumed = await newHostSocket.emitWithAck('room:host-resume', {
				memberSessionToken: created.memberSessionToken,
			})
			if (!resumed.ok) throw new Error('setup failed')

			const playerUpdateOnResume = await playerUpdateOnResumePromise
			expect(playerUpdateOnResume.members).toEqual(
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

		it('keeps the member connected when another socket takes over its session', async () => {
			const { hostSocket, created } = await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'classroom',
			})
			await joinAsPlayer(created.roomCode, 'Bob')

			const evictedPromise = new Promise<string>(resolve => {
				hostSocket.once('disconnect', resolve)
			})

			const newHostSocket = await server.connectClient()
			const resumed = await newHostSocket.emitWithAck('room:host-resume', {
				memberSessionToken: created.memberSessionToken,
			})
			if (!resumed.ok) throw new Error('setup failed')

			await evictedPromise

			const health = await request(server.httpServer)
				.get('/health')
				.expect(200)
			expect(health.body).toMatchObject({ connectedSessionCount: 2 })
		})

		it('delivers snapshots to the socket that took over', async () => {
			const { created } = await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'classroom',
			})

			const newHostSocket = await server.connectClient()
			const resumed = await newHostSocket.emitWithAck('room:host-resume', {
				memberSessionToken: created.memberSessionToken,
			})
			if (!resumed.ok) throw new Error('setup failed')

			const hostUpdatePromise = nextUpdate(newHostSocket)

			await joinAsPlayer(created.roomCode, 'Bob')

			const hostUpdate = await hostUpdatePromise
			expect(hostUpdate.members?.map(member => member.name)).toEqual([
				'Alice',
				'Bob',
			])
		})
	})

	describe('per-role visibility split', () => {
		it('reaches the right socket', async () => {
			const created = await postRoom()
			const host = trackRoomClient('host')
			const hostSocket = await server.connectClient()
			host.listen(hostSocket)
			const resumed = await hostSocket.emitWithAck('room:host-resume', {
				memberSessionToken: created.memberSessionToken,
			})
			if (!resumed.ok) throw new Error('setup failed')
			host.start(resumed.data.memberId, resumed.data.sync)

			const player = trackRoomClient('player')
			const playerSocket = await server.connectClient()
			player.listen(playerSocket)
			const joined = await playerSocket.emitWithAck('room:join', {
				roomCode: created.roomCode,
				memberName: 'Bob',
			})
			if (!joined.ok) throw new Error('setup failed')
			player.start(joined.data.memberId, joined.data.sync)

			const started = await hostSocket.emitWithAck('game:start', {
				gameConfig: DEFAULT_GAME_CONFIG,
			})
			if (!started.ok) throw new Error('setup failed')

			const revealed = await hostSocket.emitWithAck('game:reveal-round', {})
			if (!revealed.ok) throw new Error('setup failed')

			await host.waitFor(() => host.view()?.activeGame?.phase === 'revealed')
			await player.waitFor(
				() => player.view()?.activeGame?.phase === 'revealed',
			)

			const hostView = host.view()
			expect(hostView?.viewerRole).toBe('host')
			expect(hostView?.roomMode).toBe('classroom')
			if (hostView?.roomMode !== 'classroom') return
			if (hostView.phase !== 'active') return
			if (hostView.activeGame.phase !== 'revealed') return

			expect(hostView.activeGame.participants).toEqual(
				expect.arrayContaining([
					{
						participantId: joined.data.memberId,
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

			const playerView = player.view()
			expect(playerView?.viewerRole).toBe('player')
			if (playerView?.phase !== 'active') return
			if (playerView.activeGame.phase !== 'revealed') return

			expect(playerView.activeGame).not.toHaveProperty('participants')
			expect(playerView.activeGame.viewerSubmission).toMatchObject({
				countryId: null,
				isCorrect: false,
				scoreAwarded: 0,
				submittedAt: null,
			})
		})
	})

	describe('observability', () => {
		async function getHealth() {
			const response = await request(server.httpServer)
				.get('/health')
				.expect(200)
			return response.body
		}

		function emitWithoutAck(socket: RoomClientSocket, ...args: unknown[]) {
			;(socket as unknown as { emit: (...values: unknown[]) => void }).emit(
				...args,
			)
		}

		it('exposes rooms by phase, event loop delay, CPU, memory and the invalid payload count', async () => {
			await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'classroom',
			})

			expect(await getHealth()).toMatchObject({
				status: 'ok',
				roomCount: 1,
				connectedSessionCount: 1,
				roomsByPhase: { lobby: 1, active: 0, finished: 0 },
				eventLoopDelayMs: {
					p50: expect.any(Number),
					p99: expect.any(Number),
				},
				cpuMs: {
					user: expect.any(Number),
					system: expect.any(Number),
				},
				cpuPercent: expect.any(Number),
				rssMb: expect.any(Number),
				heapUsedMb: expect.any(Number),
				invalidPayloadCount: 0,
			})
		})

		it('counts invalid payloads from HTTP and sockets without logging them', async () => {
			await request(server.httpServer)
				.post('/api/rooms')
				.send({ hostName: '', roomMode: 'party' })
				.expect(400)
			await request(server.httpServer)
				.post('/api/rooms')
				.set('Content-Type', 'application/json')
				.send('{bad')
				.expect(400)
			const socket = await server.connectClient()
			const joined = await socket.emitWithAck('room:join', {
				roomCode: 'nope',
			} as never)

			expect(joined).toEqual({
				ok: false,
				error: { code: 'invalid_payload' },
			})
			expect((await getHealth()).invalidPayloadCount).toBe(3)
			expect(server.logLines).toEqual([])
		})

		it('survives events sent without an ack callback and counts them as invalid payloads', async () => {
			const socket = await server.connectClient()

			emitWithoutAck(socket, 'game:submit-answer', { countryId: 'FR' })
			emitWithoutAck(socket, 'room:join', () => {})
			const joined = await socket.emitWithAck('room:join', {
				roomCode: 'ZZZZZZ',
				memberName: 'Bob',
			})

			expect(joined).toEqual({
				ok: false,
				error: { code: 'room_not_found' },
			})
			expect(socket.connected).toBe(true)
			expect((await getHealth()).invalidPayloadCount).toBe(2)
		})

		it('logs ack errors with the socket event and error code', async () => {
			const socket = await server.connectClient()

			await socket.emitWithAck('room:join', {
				roomCode: 'ZZZZZZ',
				memberName: 'Bob',
			})

			expect(server.logLines).toEqual([
				{
					level: 'warn',
					time: expect.any(String),
					socketEvent: 'room:join',
					code: 'room_not_found',
					event: 'ack_error',
				},
			])
		})

		it('adds the room id to ack errors from a socket bound to a room', async () => {
			const { created } = await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'classroom',
			})
			const { playerSocket } = await joinAsPlayer(created.roomCode, 'Bob')

			const revealed = await playerSocket.emitWithAck(
				'game:reveal-round',
				{},
			)

			expect(revealed).toEqual({
				ok: false,
				error: { code: 'room_not_active' },
			})
			expect(server.logLines.at(-1)).toMatchObject({
				level: 'warn',
				event: 'ack_error',
				socketEvent: 'game:reveal-round',
				roomId: created.roomId,
				code: 'room_not_active',
			})
		})

		it('logs a room lifecycle without member names, room codes or session tokens', async () => {
			const { hostSocket, created } = await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'classroom',
			})
			const { playerSocket, joined } = await joinAsPlayer(
				created.roomCode,
				'Bob',
			)
			await request(server.httpServer)
				.get(`/api/rooms/${created.roomCode}`)
				.expect(200)
			const started = await hostSocket.emitWithAck('game:start', {
				gameConfig: DEFAULT_GAME_CONFIG,
			})
			if (!started.ok) throw new Error('setup failed')
			await playerSocket.emitWithAck('room:join', {
				roomCode: created.roomCode,
				memberName: 'Zoltan',
			})
			const terminated = await hostSocket.emitWithAck('room:terminate', {})
			if (!terminated.ok) throw new Error('setup failed')

			expect(server.logLines.map(line => line.event)).toEqual([
				'room_created',
				'game_started',
				'ack_error',
				'room_closed',
			])
			const serialized = JSON.stringify(server.logLines)
			for (const value of [
				'Alice',
				'Bob',
				'Zoltan',
				created.roomCode,
				created.memberSessionToken,
				joined.memberSessionToken,
			]) {
				expect(serialized).not.toContain(value)
			}
		})
	})

	describe('room sync protocol', () => {
		async function connectTracked(role: 'host' | 'player') {
			const client = trackRoomClient(role)
			const socket = await server.connectClient()
			client.listen(socket)
			return { client, socket }
		}

		async function setUpClassroom(playerNames: string[]) {
			const created = await postRoom()
			const host = await connectTracked('host')
			const resumed = await host.socket.emitWithAck('room:host-resume', {
				memberSessionToken: created.memberSessionToken,
			})
			if (!resumed.ok) throw new Error('setup failed')
			host.client.start(resumed.data.memberId, resumed.data.sync)

			const players = []
			for (const memberName of playerNames) {
				const player = await connectTracked('player')
				const joined = await player.socket.emitWithAck('room:join', {
					roomCode: created.roomCode,
					memberName,
				})
				if (!joined.ok) throw new Error('setup failed')
				player.client.start(joined.data.memberId, joined.data.sync)
				players.push({ ...player, joined: joined.data })
			}

			return { created, host, players, resumed: resumed.data }
		}

		function getRoomContext(roomId: string) {
			const context = server.repository.getRoomById(roomId)
			if (!context) throw new Error('room not found')
			return context
		}

		async function waitForServerRevision(
			roomId: string,
			clients: TrackedRoomClient[],
		) {
			const { revision } = getRoomContext(roomId)
			await Promise.all(
				clients.map(client =>
					client.waitFor(() => client.state?.sync.revision === revision),
				),
			)
		}

		function getOpenQuestion(roomId: string) {
			const { state } = getRoomContext(roomId)
			if (state.phase !== 'active' || state.activeGame.phase !== 'open') {
				throw new Error('expected an open round')
			}
			return state.activeGame.currentRound.questionId
		}

		it('rebuilds the full client state after a mid-game reconnect', async () => {
			const { created, host, players } = await setUpClassroom(['Bob', 'Tom'])
			const [stayer, leaver] = players as [
				(typeof players)[number],
				(typeof players)[number],
			]

			const started = await host.socket.emitWithAck('game:start', {
				gameConfig: DEFAULT_GAME_CONFIG,
			})
			if (!started.ok) throw new Error('setup failed')

			leaver.socket.disconnect()
			await host.client.waitFor(
				() =>
					host.client
						.view()
						?.members.find(
							member => member.memberId === leaver.joined.memberId,
						)?.connected === false,
			)

			const answered = await stayer.socket.emitWithAck(
				'game:submit-answer',
				{
					countryId: getOpenQuestion(created.roomId),
				},
			)
			if (!answered.ok) throw new Error('setup failed')
			for (const command of [
				'game:reveal-round',
				'game:advance-round',
			] as const) {
				const result = await host.socket.emitWithAck(command, {})
				if (!result.ok) throw new Error('setup failed')
			}
			const answeredAgain = await stayer.socket.emitWithAck(
				'game:submit-answer',
				{ countryId: getOpenQuestion(created.roomId) },
			)
			if (!answeredAgain.ok) throw new Error('setup failed')

			const returning = await connectTracked('player')
			const resumed = await returning.socket.emitWithAck(
				'room:player-resume',
				{ memberSessionToken: leaver.joined.memberSessionToken },
			)
			if (!resumed.ok) throw new Error('setup failed')
			returning.client.start(resumed.data.memberId, resumed.data.sync)

			expect(
				resumed.data.sync.game?.eligibleCountryIds.length,
			).toBeGreaterThan(0)
			expect(returning.client.view()).toStrictEqual(
				toPlayerRoomView(
					getRoomContext(created.roomId).state,
					leaver.joined.memberId,
				),
			)

			const lastAnswer = await returning.socket.emitWithAck(
				'game:submit-answer',
				{ countryId: getOpenQuestion(created.roomId) },
			)
			if (!lastAnswer.ok) throw new Error('setup failed')

			const clients = [host.client, stayer.client, returning.client]
			await waitForServerRevision(created.roomId, clients)

			const { state } = getRoomContext(created.roomId)
			expect(state.phase === 'active' && state.activeGame.phase).toBe(
				'revealed',
			)
			expect(host.client.view()).toStrictEqual(
				toHostRoomView(state, created.memberId),
			)
			expect(stayer.client.view()).toStrictEqual(
				toPlayerRoomView(state, stayer.joined.memberId),
			)
			expect(returning.client.view()).toStrictEqual(
				toPlayerRoomView(state, leaver.joined.memberId),
			)
			for (const client of clients) {
				expect(client.state?.outOfSync).toBe(false)
			}
		})

		it('sends the game constants at start and on resume, not with each answer', async () => {
			const { created, host, players } = await setUpClassroom(['Bob'])
			const player = players[0]!

			const started = await host.socket.emitWithAck('game:start', {
				gameConfig: DEFAULT_GAME_CONFIG,
			})
			if (!started.ok) throw new Error('setup failed')
			await waitForServerRevision(created.roomId, [player.client])

			const startUpdate = player.client.received.at(-1)
			expect(startUpdate?.event).toBe('room:update')
			expect(startUpdate?.payload.game).toMatchObject({
				eligibleCountryIds: expect.arrayContaining([expect.any(String)]),
			})

			const answered = await player.socket.emitWithAck(
				'game:submit-answer',
				{
					countryId: getOpenQuestion(created.roomId),
				},
			)
			if (!answered.ok) throw new Error('setup failed')
			await waitForServerRevision(created.roomId, [player.client])

			const answerEvents = player.client.received.slice(
				player.client.received.indexOf(startUpdate!) + 1,
			)
			expect(answerEvents.map(received => received.event)).toEqual([
				'room:viewer',
				'room:update',
			])
			const answerUpdate = answerEvents[1]!.payload
			expect(answerUpdate).not.toHaveProperty('game')
			expect(answerUpdate).not.toHaveProperty('members')
			expect(JSON.stringify(answerUpdate)).not.toContain(
				'eligibleCountryIds',
			)

			const resumed = await player.socket.emitWithAck('room:player-resume', {
				memberSessionToken: player.joined.memberSessionToken,
			})
			if (!resumed.ok) throw new Error('setup failed')
			expect(resumed.data.sync.game).toEqual(startUpdate?.payload.game)
		})

		it('sends host-only data to the host socket and never to players', async () => {
			const { created, host, players } = await setUpClassroom(['Bob', 'Tom'])

			const started = await host.socket.emitWithAck('game:start', {
				gameConfig: DEFAULT_GAME_CONFIG,
			})
			if (!started.ok) throw new Error('setup failed')
			for (const player of players) {
				const answered = await player.socket.emitWithAck(
					'game:submit-answer',
					{ countryId: getOpenQuestion(created.roomId) },
				)
				if (!answered.ok) throw new Error('setup failed')
				const { revision } = getRoomContext(created.roomId)
				await player.client.waitFor(
					() => player.client.state?.sync.revision === revision,
				)
			}
			const advanced = await host.socket.emitWithAck(
				'game:advance-round',
				{},
			)
			if (!advanced.ok) throw new Error('setup failed')
			await waitForServerRevision(created.roomId, [
				host.client,
				...players.map(player => player.client),
			])

			expect(
				host.client.received.some(
					received => received.event === 'room:host-detail',
				),
			).toBe(true)
			for (const player of players) {
				for (const received of player.client.received) {
					expect(received.event).not.toBe('room:host-detail')
					expect(JSON.stringify(received.payload)).not.toContain(
						'"participants"',
					)
				}
			}
		})

		it('puts serverNow in every server event and in join and resume responses', async () => {
			const { created, host, players, resumed } = await setUpClassroom([
				'Bob',
			])
			const player = players[0]!
			expect(typeof resumed.serverNow).toBe('number')
			expect(typeof player.joined.serverNow).toBe('number')

			const started = await host.socket.emitWithAck('game:start', {
				gameConfig: DEFAULT_GAME_CONFIG,
			})
			if (!started.ok) throw new Error('setup failed')
			const answered = await player.socket.emitWithAck(
				'game:submit-answer',
				{
					countryId: getOpenQuestion(created.roomId),
				},
			)
			if (!answered.ok) throw new Error('setup failed')
			const advanced = await host.socket.emitWithAck(
				'game:advance-round',
				{},
			)
			if (!advanced.ok) throw new Error('setup failed')

			const playerClosed = new Promise<RoomClosedEvent>(resolve => {
				player.socket.once('room:closed', resolve)
			})
			const terminated = await host.socket.emitWithAck('room:terminate', {})
			if (!terminated.ok) throw new Error('setup failed')
			await playerClosed

			const received = [...host.client.received, ...player.client.received]
			expect(new Set(received.map(event => event.event))).toEqual(
				new Set([
					'room:update',
					'room:viewer',
					'room:host-detail',
					'room:closed',
				]),
			)
			for (const event of received) {
				expect(typeof event.payload.serverNow).toBe('number')
			}
		})
	})

	describe('socket handler failures', () => {
		function failureLines() {
			return server.logLines.filter(
				line => line.event === 'socket_handler_failed',
			)
		}

		it('replies internal_error to a session command that throws, logs it once and keeps serving', async () => {
			const { hostSocket, created } = await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'classroom',
			})
			const { playerSocket } = await joinAsPlayer(created.roomCode, 'Bob')
			const started = await hostSocket.emitWithAck('game:start', {
				gameConfig: DEFAULT_GAME_CONFIG,
			})
			if (!started.ok) throw new Error('setup failed')
			const submitAnswer = vi
				.spyOn(server.roomsService, 'submitAnswer')
				.mockImplementation(() => {
					throw new Error('boom')
				})

			const submitted = await playerSocket.emitWithAck(
				'game:submit-answer',
				{
					countryId: '250',
				},
			)

			expect(submitted).toEqual({
				ok: false,
				error: { code: 'internal_error' },
			})
			expect(server.logLines.filter(line => line.level === 'error')).toEqual(
				[
					{
						level: 'error',
						time: expect.any(String),
						err: expect.objectContaining({
							type: 'Error',
							message: 'boom',
							stack: expect.stringContaining('Error: boom'),
						}),
						socketEvent: 'game:submit-answer',
						roomId: created.roomId,
						event: 'socket_handler_failed',
					},
				],
			)
			expect(
				server.logLines.filter(line => line.event === 'ack_error'),
			).toEqual([])

			submitAnswer.mockRestore()
			const retried = await playerSocket.emitWithAck('game:submit-answer', {
				countryId: '250',
			})
			expect(retried.ok).toBe(true)
			expect(playerSocket.connected).toBe(true)
		})

		it('leaves the socket unbound when join throws', async () => {
			const { created } = await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'classroom',
			})
			const socket = await server.connectClient()
			const joinRoom = vi
				.spyOn(server.roomsService, 'joinRoom')
				.mockImplementation(() => {
					throw new Error('boom')
				})

			const failed = await socket.emitWithAck('room:join', {
				roomCode: created.roomCode,
				memberName: 'Bob',
			})

			expect(failed).toEqual({
				ok: false,
				error: { code: 'internal_error' },
			})
			expect(failureLines()).toMatchObject([
				{ socketEvent: 'room:join', err: { message: 'boom' } },
			])

			joinRoom.mockRestore()
			const joined = await socket.emitWithAck('room:join', {
				roomCode: created.roomCode,
				memberName: 'Bob',
			})
			expect(joined.ok).toBe(true)
		})

		it('replies internal_error when resume throws', async () => {
			const created = await postRoom()
			const socket = await server.connectClient()
			vi.spyOn(server.roomsService, 'resumeHostRoom').mockImplementation(
				() => {
					throw new Error('boom')
				},
			)

			const resumed = await socket.emitWithAck('room:host-resume', {
				memberSessionToken: created.memberSessionToken,
			})

			expect(resumed).toEqual({
				ok: false,
				error: { code: 'internal_error' },
			})
			expect(failureLines()).toMatchObject([
				{ socketEvent: 'room:host-resume', err: { message: 'boom' } },
			])
		})

		it('logs a disconnect handler that throws and keeps serving', async () => {
			const { created } = await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'classroom',
			})
			const { playerSocket } = await joinAsPlayer(created.roomCode, 'Bob')
			vi.spyOn(server.roomsService, 'disconnectMember').mockImplementation(
				() => {
					throw new Error('boom')
				},
			)

			playerSocket.disconnect()

			await vi.waitFor(() => {
				expect(failureLines()).toMatchObject([
					{
						socketEvent: 'disconnect',
						roomId: created.roomId,
						err: { message: 'boom' },
					},
				])
			})
			await request(server.httpServer).get('/health').expect(200)
		})

		it('clears the socket identity after a successful terminate', async () => {
			const { hostSocket } = await server.createRoomAsHost({
				hostName: 'Alice',
				roomMode: 'classroom',
			})

			const terminated = await hostSocket.emitWithAck('room:terminate', {})
			const started = await hostSocket.emitWithAck('game:start', {
				gameConfig: DEFAULT_GAME_CONFIG,
			})

			expect(terminated.ok).toBe(true)
			expect(started).toEqual({ ok: false, error: { code: 'unauthorized' } })
		})
	})
})
