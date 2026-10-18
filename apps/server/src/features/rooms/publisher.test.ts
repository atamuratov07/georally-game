import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playableCountryPool } from '@georally/country-catalog'
import {
	applyRoomSyncHostDetailUpdate,
	applyRoomSyncUpdate,
	applyRoomSyncViewerUpdate,
	composeHostRoomView,
	composePlayerRoomView,
	createRoomSyncState,
	toHostRoomView,
	toPlayerRoomView,
	type MemberId,
	type RoomMemberRole,
	type RoomMode,
	type RoomSync,
	type RoomSyncState,
} from '@georally/game-domain/multiplayer/room'
import type {
	RoomHostDetailEvent,
	RoomUpdateEvent,
	RoomViewerEvent,
} from '@georally/game-protocol'

import { memberChannel, roomChannel } from './channels.js'
import { createRoomPublisher } from './publisher.js'
import { RoomsRepository } from './repository.js'
import { RoomsService } from './service.js'
import type { GameNamespace } from './types.js'

const PHASE_DURATION_MS = 1_000
const HOST_ONLY_KEYS = [
	'participants',
	'hostDetail',
	'viewer',
	'viewerSubmission',
]

interface EmittedMessage {
	channel: string
	event: string
	payload: Record<string, unknown>
}

interface SimulatedClient {
	memberId: MemberId
	role: RoomMemberRole
	state: RoomSyncState
	inbox: { event: string; payload: unknown }[]
}

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
	if (Array.isArray(value)) {
		for (const item of value) {
			collectKeys(item, keys)
		}
	} else if (value && typeof value === 'object') {
		for (const [key, item] of Object.entries(value)) {
			keys.add(key)
			collectKeys(item, keys)
		}
	}
	return keys
}

function createHarness(roomMode: RoomMode) {
	const channels = new Map<string, Set<MemberId>>()
	const emitted: EmittedMessage[] = []
	const clients = new Map<MemberId, SimulatedClient>()
	const tokens = new Map<MemberId, string>()

	const namespace = {
		adapter: { rooms: channels },
		to: (channel: string) => ({
			emit: (event: string, payload: Record<string, unknown>) => {
				emitted.push({ channel, event, payload })
				for (const memberId of channels.get(channel) ?? []) {
					clients.get(memberId)?.inbox.push({ event, payload })
				}
				return true
			},
		}),
	} as unknown as GameNamespace

	const repository = new RoomsRepository()
	const publisher = createRoomPublisher({ namespace, repository })
	const service = new RoomsService({
		countryPool: playableCountryPool,
		repository,
		revealDurationMs: PHASE_DURATION_MS,
		leaderboardDurationMs: PHASE_DURATION_MS,
		roomCapacityLimit: 40,
		roomExpireTTL: {
			finishedMs: 60_000_000,
			hostDisconnectedInGroupMs: 60_000_000,
			hostDisconnectedInClassroomMs: 60_000_000,
			noConnectedMembersMs: 60_000_000,
		},
		hooks: {
			onRoomUpdated: roomId => publisher.publishRoomUpdate(roomId),
			onRoomClosed: (roomId, reason) =>
				publisher.publishRoomClosed(roomId, reason),
		},
	})

	const created = service.createRoom({ hostName: 'Alice', roomMode })
	if (!created.ok) throw new Error('setup failed')
	const { roomId } = created.value
	tokens.set(created.value.memberId, created.value.memberSessionToken)

	function join(channel: string, memberId: MemberId) {
		let members = channels.get(channel)
		if (!members) {
			members = new Set()
			channels.set(channel, members)
		}
		members.add(memberId)
	}

	function attach(memberId: MemberId, role: RoomMemberRole, sync: RoomSync) {
		clients.set(memberId, {
			memberId,
			role,
			state: createRoomSyncState(sync),
			inbox: [],
		})
		join(memberChannel(memberId), memberId)
		join(roomChannel(roomId), memberId)
	}

	function detach(memberId: MemberId) {
		channels.get(memberChannel(memberId))?.delete(memberId)
		channels.get(roomChannel(roomId))?.delete(memberId)
		clients.delete(memberId)
	}

	function deliver() {
		for (const client of clients.values()) {
			for (const { event, payload } of client.inbox.splice(0)) {
				if (event === 'room:update') {
					client.state = applyRoomSyncUpdate(
						client.state,
						payload as RoomUpdateEvent,
					)
				}
				if (event === 'room:viewer') {
					client.state = applyRoomSyncViewerUpdate(
						client.state,
						payload as RoomViewerEvent,
					)
				}
				if (event === 'room:host-detail') {
					client.state = applyRoomSyncHostDetailUpdate(
						client.state,
						payload as RoomHostDetailEvent,
					)
				}
			}
		}
	}

	function expectClientsMatchServer() {
		deliver()
		const context = repository.getRoomById(roomId)
		if (!context) throw new Error('room not found')

		for (const client of clients.values()) {
			expect(client.state.outOfSync).toBe(false)
			expect(client.state.sync.revision).toBe(context.revision)
			const view =
				client.role === 'host'
					? composeHostRoomView(client.state.sync, client.memberId)
					: composePlayerRoomView(client.state.sync, client.memberId)
			const expected =
				client.role === 'host'
					? toHostRoomView(context.state, client.memberId)
					: toPlayerRoomView(context.state, client.memberId)
			expect(view).toStrictEqual(expected)
		}
	}

	function resumeHost() {
		const resumed = service.resumeHostRoom({
			memberSessionToken: created.ok ? created.value.memberSessionToken : '',
		})
		if (!resumed.ok) throw new Error('setup failed')
		attach(resumed.value.memberId, 'host', resumed.value.sync)
		return resumed.value
	}

	function joinPlayer(memberName: string) {
		const joined = service.joinRoom({
			roomCode: created.ok ? created.value.roomCode : '',
			memberName,
		})
		if (!joined.ok) throw new Error('setup failed')
		tokens.set(joined.value.memberId, joined.value.memberSessionToken)
		attach(joined.value.memberId, 'player', joined.value.sync)
		return joined.value.memberId
	}

	function resumePlayer(memberId: MemberId) {
		const resumed = service.resumePlayerRoom({
			memberSessionToken: tokens.get(memberId)!,
		})
		if (!resumed.ok) throw new Error('setup failed')
		attach(memberId, 'player', resumed.value.sync)
		return resumed.value
	}

	function getState() {
		const context = repository.getRoomById(roomId)
		if (!context) throw new Error('room not found')
		return context.state
	}

	function answer(memberId: MemberId, correct: boolean) {
		const state = getState()
		if (state.phase !== 'active' || state.activeGame.phase !== 'open') {
			throw new Error('expected an open round')
		}
		const { questionId } = state.activeGame.currentRound
		const wrongId = state.activeGame.session.eligibleIds.find(
			countryId => countryId !== questionId,
		)!
		const firstMessage = emitted.length
		const submitted = service.submitAnswer({
			memberSessionToken: tokens.get(memberId)!,
			countryId: correct ? questionId : wrongId,
		})
		if (!submitted.ok) throw new Error('answer rejected')
		return emitted.slice(firstMessage)
	}

	function hostCommand(
		command: 'startGame' | 'advanceGameRound' | 'returnToLobby',
	) {
		const memberSessionToken = created.ok
			? created.value.memberSessionToken
			: ''
		const result =
			command === 'startGame'
				? service.startGame({
						memberSessionToken,
						gameConfig: {
							questionCount: 3,
							difficulty: 'easy',
							scope: 'all',
							questionDurationMs: 60_000,
						},
					})
				: service[command]({ memberSessionToken })
		if (!result.ok) throw new Error(`${command} failed`)
	}

	return {
		roomId,
		hostId: created.value.memberId,
		emitted,
		service,
		getState,
		resumeHost,
		joinPlayer,
		resumePlayer,
		detach,
		answer,
		hostCommand,
		expectClientsMatchServer,
	}
}

type Harness = ReturnType<typeof createHarness>

function getParticipantIds(harness: Harness) {
	const state = harness.getState()
	if (state.phase !== 'active') throw new Error('expected an active room')
	return state.memberOrder.filter(
		memberId => memberId in state.activeGame.participantsById,
	)
}

function finishRound(harness: Harness, roomMode: RoomMode) {
	harness.expectClientsMatchServer()
	if (roomMode === 'classroom') {
		harness.hostCommand('advanceGameRound')
		harness.expectClientsMatchServer()
		return
	}
	vi.advanceTimersByTime(PHASE_DURATION_MS)
	harness.expectClientsMatchServer()
	vi.advanceTimersByTime(PHASE_DURATION_MS)
	harness.expectClientsMatchServer()
}

function playGame(harness: Harness, roomMode: RoomMode, onRound?: () => void) {
	harness.hostCommand('startGame')
	harness.expectClientsMatchServer()

	for (let round = 1; round <= 3; round += 1) {
		if (round === 2 && onRound) {
			onRound()
			continue
		}
		for (const [index, memberId] of getParticipantIds(harness).entries()) {
			harness.answer(memberId, index % 2 === 0)
			harness.expectClientsMatchServer()
		}
		finishRound(harness, roomMode)
	}
}

describe('room publisher', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	describe.each<RoomMode>(['group', 'classroom'])('in %s mode', roomMode => {
		it('keeps every client equal to the server view through two games and a mid-game reconnect', () => {
			const harness = createHarness(roomMode)
			harness.resumeHost()
			harness.expectClientsMatchServer()

			const playerIds = ['Bob', 'Tom', 'Eve'].map(name => {
				const memberId = harness.joinPlayer(name)
				harness.expectClientsMatchServer()
				return memberId
			})
			const reconnectingId = playerIds[2]!

			playGame(harness, roomMode, () => {
				harness.detach(reconnectingId)
				harness.service.disconnectMember(harness.roomId, reconnectingId)
				harness.expectClientsMatchServer()

				const participantIds = getParticipantIds(harness)
				for (const [index, memberId] of participantIds.entries()) {
					if (memberId !== reconnectingId) {
						harness.answer(memberId, index % 2 === 0)
						harness.expectClientsMatchServer()
					}
				}

				harness.resumePlayer(reconnectingId)
				harness.expectClientsMatchServer()
				harness.answer(reconnectingId, true)
				finishRound(harness, roomMode)
			})
			expect(harness.getState().phase).toBe('finished')

			harness.hostCommand('returnToLobby')
			harness.expectClientsMatchServer()
			playGame(harness, roomMode)
			expect(harness.getState().phase).toBe('finished')
		})

		it('sends the game constants once per game and only the changed parts per answer', () => {
			const harness = createHarness(roomMode)
			const host = harness.resumeHost()
			const playerIds = ['Bob', 'Tom', 'Eve'].map(name =>
				harness.joinPlayer(name),
			)
			const firstGameMessage = harness.emitted.length
			harness.hostCommand('startGame')

			const [startUpdate] = harness.emitted
				.slice(firstGameMessage)
				.filter(message => message.event === 'room:update')
			expect(startUpdate?.payload.game).toMatchObject({
				eligibleCountryIds: expect.arrayContaining([expect.any(String)]),
			})

			const answerer = playerIds[0]!
			const messages = harness.answer(answerer, true)
			expect(
				messages.map(({ channel, event }) => ({ channel, event })),
			).toEqual([
				...(roomMode === 'classroom'
					? [
							{
								channel: memberChannel(host.memberId),
								event: 'room:host-detail',
							},
						]
					: []),
				{ channel: memberChannel(answerer), event: 'room:viewer' },
				{ channel: roomChannel(harness.roomId), event: 'room:update' },
			])
			const update = messages.at(-1)!.payload
			expect(update).not.toHaveProperty('game')
			expect(update).not.toHaveProperty('members')
			expect(update).not.toHaveProperty('lastGameResult')
			expect(collectKeys(update).has('eligibleCountryIds')).toBe(false)

			const resumed = harness.resumePlayer(playerIds[1]!)
			expect(resumed.sync.game?.eligibleCountryIds.length).toBeGreaterThan(0)
			expect(resumed.sync.game?.gameId).toBe(
				(startUpdate?.payload.game as { gameId: string }).gameId,
			)
		})

		it('never puts host-only or per-viewer data on the room channel', () => {
			const harness = createHarness(roomMode)
			harness.resumeHost()
			for (const name of ['Bob', 'Tom', 'Eve']) {
				harness.joinPlayer(name)
			}
			playGame(harness, roomMode)

			const roomMessages = harness.emitted.filter(message =>
				message.channel.startsWith('room:'),
			)
			expect(roomMessages.length).toBeGreaterThan(0)
			for (const message of roomMessages) {
				expect(['room:update', 'room:closed']).toContain(message.event)
				const keys = collectKeys(message.payload)
				for (const key of HOST_ONLY_KEYS) {
					expect(keys.has(key)).toBe(false)
				}
			}

			const hostDetailChannels = new Set(
				harness.emitted
					.filter(message => message.event === 'room:host-detail')
					.map(message => message.channel),
			)
			expect([...hostDetailChannels]).toEqual(
				roomMode === 'classroom' ? [memberChannel(harness.hostId)] : [],
			)
		})

		it('puts serverNow in every envelope', () => {
			const harness = createHarness(roomMode)
			const host = harness.resumeHost()
			const playerId = harness.joinPlayer('Bob')
			playGame(harness, roomMode)
			const resumed = harness.resumePlayer(playerId)
			harness.service.closeRoom(harness.roomId, 'host_terminated')

			expect(typeof host.serverNow).toBe('number')
			expect(typeof resumed.serverNow).toBe('number')
			const events = new Set(harness.emitted.map(message => message.event))
			expect(events).toEqual(
				new Set([
					'room:update',
					'room:viewer',
					'room:closed',
					...(roomMode === 'classroom' ? ['room:host-detail'] : []),
				]),
			)
			for (const message of harness.emitted) {
				expect(Number.isFinite(message.payload.serverNow)).toBe(true)
			}
		})
	})
})
