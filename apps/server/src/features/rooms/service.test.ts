import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playableCountryPool } from '@georally/country-catalog'

import { RoomsRepository } from './repository.js'
import { RoomsService, type CreateRoomInput } from './service.js'
import { DEFAULT_GAME_CONFIG } from '@georally/game-domain/multiplayer'
import type { RoomExpireTTLConfig } from '@georally/game-domain/multiplayer/room'
import { createLogger, type Logger } from '../../observability/logger.js'

function createService(
	overrides: {
		roomCapacityLimit?: number
		revealDurationMs?: number
		leaderboardDurationMs?: number
		roomExpireTTL?: Partial<RoomExpireTTLConfig>
		logger?: Logger
		now?: () => number
	} = {},
) {
	const repository = new RoomsRepository()
	const hooks = {
		onRoomUpdated: vi.fn(),
		onRoomClosed: vi.fn(),
	}

	const service = new RoomsService({
		countryPool: playableCountryPool,
		repository,
		revealDurationMs: overrides.revealDurationMs ?? 5_000,
		leaderboardDurationMs: overrides.leaderboardDurationMs ?? 5_000,
		roomCapacityLimit: overrides?.roomCapacityLimit ?? 40,
		hooks,
		roomExpireTTL: {
			finishedMs: 1_000 * 60 * 15,
			hostDisconnectedInGroupMs: 1_000 * 60 * 5,
			hostDisconnectedInClassroomMs: 1_000 * 60 * 3,
			noConnectedMembersMs: 1_000 * 60 * 10,
			...overrides.roomExpireTTL,
		},
		logger: overrides.logger,
		now: overrides.now,
	})

	function createHostedRoom(input: CreateRoomInput) {
		const created = service.createRoom(input)
		if (!created.ok) throw new Error('setup failed')

		const resumed = service.resumeHostRoom({
			memberSessionToken: created.value.memberSessionToken,
		})
		if (!resumed.ok) throw new Error('setup failed')

		hooks.onRoomUpdated.mockClear()
		return created.value
	}

	return { service, repository, hooks, createHostedRoom }
}

describe('RoomsService.createRoom', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('creates a room with a disconnected host and does not broadcast', () => {
		const { service, repository, hooks } = createService()

		const created = service.createRoom({
			hostName: 'Alice',
			roomMode: 'group',
		})

		expect(created.ok).toBe(true)
		if (!created.ok) return

		expect(created.value.role).toBe('host')
		expect(created.value.roomCode).toHaveLength(6)
		expect(hooks.onRoomUpdated).not.toHaveBeenCalled()

		const room = repository.getRoomById(created.value.roomId)
		expect(room?.state.membersById[created.value.memberId]?.connected).toBe(
			false,
		)
		expect(room?.scheduledExpire).not.toBeNull()
	})

	it('expires a room whose host never connects', () => {
		const noConnectedMembersMs = 1_000
		const { service, hooks } = createService({
			roomExpireTTL: { noConnectedMembersMs },
		})

		const created = service.createRoom({
			hostName: 'Alice',
			roomMode: 'group',
		})
		if (!created.ok) throw new Error('setup failed')

		vi.advanceTimersByTime(noConnectedMembersMs - 1)
		expect(hooks.onRoomClosed).not.toHaveBeenCalled()

		vi.advanceTimersByTime(1)
		expect(hooks.onRoomClosed).toHaveBeenCalledWith(
			created.value.roomId,
			'expired',
		)
		expect(service.lookupRoom(created.value.roomCode).exists).toBe(false)
	})
})

describe('RoomsService.joinRoom', () => {
	it('rejects a room code that does not exist', () => {
		const { service } = createService()

		const joined = service.joinRoom({
			roomCode: 'ZZZZZZ',
			memberName: 'Bob',
		})

		expect(joined.ok).toBe(false)
		if (joined.ok) return
		expect(joined.error.code).toBe('room_not_found')
	})

	it('lets players join a room the host created', () => {
		const { service, hooks, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})

		expect(joined.ok).toBe(true)
		if (!joined.ok) return

		expect(joined.value.role).toBe('player')
		expect(hooks.onRoomUpdated).toHaveBeenCalledTimes(1)
	})

	it('rejects a name already taken in the room', () => {
		const { service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'group',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Alice',
		})

		expect(joined.ok).toBe(false)
		if (joined.ok) return
		expect(joined.error.code).toBe('member_name_taken')
	})

	it('counts the host toward the limit in group mode', () => {
		const { service, createHostedRoom } = createService({
			roomCapacityLimit: 2,
		})
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'group',
		})

		const joinedOne = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		expect(joinedOne.ok).toBe(true)

		const joinedTwo = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Tom',
		})

		expect(joinedTwo.ok).toBe(false)
		if (joinedTwo.ok) return
		expect(joinedTwo.error.code).toBe(
			'room_participant_capacity_limit_exceeded',
		)
	})

	it('excludes the host from the limit in classroom mode', () => {
		const { service, createHostedRoom } = createService({
			roomCapacityLimit: 2,
		})
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joinedOne = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		expect(joinedOne.ok).toBe(true)

		const joinedTwo = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Tom',
		})
		expect(joinedTwo.ok).toBe(true)

		const joinedThree = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Jerry',
		})

		expect(joinedThree.ok).toBe(false)
		if (joinedThree.ok) return
		expect(joinedThree.error.code).toBe(
			'room_participant_capacity_limit_exceeded',
		)
	})
})

describe('RoomsService.startGame', () => {
	it('rejects a start attempt from a non-host member', () => {
		const { service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const started = service.startGame({
			gameConfig: DEFAULT_GAME_CONFIG,
			memberSessionToken: joined.value.memberSessionToken,
		})

		expect(started.ok).toBe(false)
		if (started.ok) return
		expect(started.error).toMatchObject({ code: 'only_host_can_manage_room' })
	})

	it('fails when the room has no game participants', () => {
		const { service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const started = service.startGame({
			gameConfig: DEFAULT_GAME_CONFIG,
			memberSessionToken: created.memberSessionToken,
		})

		expect(started.ok).toBe(false)
		if (started.ok) return
		expect(started.error).toMatchObject({ code: 'game_has_no_participants' })
	})

	it('fails when there are fewer eligible countries than the question count', () => {
		const { service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'group',
		})

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: {
				difficulty: 'easy',
				scope: 'oceania',
				questionCount: 30,
				questionDurationMs: 30_000,
			},
		})

		expect(started.ok).toBe(false)
		if (started.ok) return
		expect(started.error).toMatchObject({
			code: 'insufficient_eligible_countries',
			questionCount: 30,
			countryCount: 2,
		})
	})

	it('rejects a missing questionDurationMs in group mode', () => {
		const { service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'group',
		})

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: {
				difficulty: 'easy',
				scope: 'all',
				questionCount: 10,
				questionDurationMs: undefined,
			},
		})

		expect(started.ok).toBe(false)
		if (started.ok) return
		expect(started.error).toMatchObject({ code: 'invalid_game_config' })
	})

	it('accepts a missing questionDurationMs in classroom mode', () => {
		const { service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: {
				difficulty: 'easy',
				scope: 'all',
				questionCount: 10,
				questionDurationMs: undefined,
			},
		})

		expect(started.ok).toBe(true)
	})

	it('accepts a questionDurationMs in classroom mode', () => {
		const { service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: DEFAULT_GAME_CONFIG,
		})

		expect(started.ok).toBe(true)
	})

	it('excludes the host from participants in classroom mode', () => {
		const { service, hooks, repository, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: DEFAULT_GAME_CONFIG,
		})
		if (!started.ok) throw new Error('setup failed')

		expect(hooks.onRoomUpdated).toHaveBeenCalledTimes(2)
		expect(hooks.onRoomUpdated).toHaveBeenLastCalledWith(created.roomId)

		const room = repository.getRoomById(created.roomId)
		if (!room) throw new Error('room not created')
		if (room.state.phase !== 'active')
			throw new Error('expected active phase')

		expect(room.state.activeGame.participantsById).not.toHaveProperty(
			room.state.hostId,
		)
	})

	it('includes the host as a participant in group mode', () => {
		const { service, hooks, repository, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'group',
		})

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: DEFAULT_GAME_CONFIG,
		})
		if (!started.ok) throw new Error('setup failed')

		expect(hooks.onRoomUpdated).toHaveBeenCalledTimes(1)
		expect(hooks.onRoomUpdated).toHaveBeenLastCalledWith(created.roomId)

		const room = repository.getRoomById(created.roomId)
		if (!room) throw new Error('room not created')
		if (room.state.phase !== 'active')
			throw new Error('expected active phase')

		expect(room.state.activeGame.participantsById).toHaveProperty(
			room.state.hostId,
		)
	})

	it('excludes disconnected members from the participant list', () => {
		const { service, hooks, repository, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joinedOne = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		const joinedTwo = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Tom',
		})
		if (!joinedOne.ok || !joinedTwo.ok) throw new Error('setup failed')

		service.disconnectMember(created.roomId, joinedOne.value.memberId)

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: DEFAULT_GAME_CONFIG,
		})
		if (!started.ok) throw new Error('setup failed')

		expect(hooks.onRoomUpdated).toHaveBeenLastCalledWith(created.roomId)

		const room = repository.getRoomById(created.roomId)
		if (!room) throw new Error('room not created')
		if (room.state.phase !== 'active')
			throw new Error('expected active phase')

		expect(Object.keys(room.state.activeGame.participantsById)).toEqual([
			joinedTwo.value.memberId,
		])
	})
})

describe('RoomsService.submitAnswer', () => {
	it('rejects a second answer from the same participant', () => {
		const { service, repository, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joinedOne = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		const joinedTwo = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Tom',
		})
		if (!joinedOne.ok || !joinedTwo.ok) throw new Error('setup failed')

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: {
				difficulty: 'hard',
				scope: 'all',
				questionCount: 10,
				questionDurationMs: undefined,
			},
		})
		if (!started.ok) throw new Error('setup failed')

		const room = repository.getRoomById(created.roomId)
		if (room?.state.phase !== 'active')
			throw new Error('expected active phase')
		expect(room.state.activeGame.phase).toBe('open')

		const submittedOne = service.submitAnswer({
			memberSessionToken: joinedOne.value.memberSessionToken,
			countryId: '840',
		})
		if (!submittedOne.ok) throw new Error('setup failed')

		const submittedTwo = service.submitAnswer({
			memberSessionToken: joinedOne.value.memberSessionToken,
			countryId: '860',
		})

		expect(submittedTwo.ok).toBe(false)
		if (submittedTwo.ok) return
		expect(submittedTwo.error.code).toBe('participant_already_submitted')
	})

	it('reveals immediately once every participant has answered', () => {
		const { service, repository, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joinedOne = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		const joinedTwo = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Tom',
		})
		if (!joinedOne.ok || !joinedTwo.ok) throw new Error('setup failed')

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: {
				difficulty: 'easy',
				scope: 'all',
				questionCount: 10,
				questionDurationMs: undefined,
			},
		})
		if (!started.ok) throw new Error('setup failed')

		service.submitAnswer({
			memberSessionToken: joinedOne.value.memberSessionToken,
			countryId: '840',
		})

		let room = repository.getRoomById(created.roomId)
		if (room?.state.phase !== 'active')
			throw new Error('expected active phase')
		expect(room.state.activeGame.phase).toBe('open')

		service.submitAnswer({
			memberSessionToken: joinedTwo.value.memberSessionToken,
			countryId: '840',
		})

		room = repository.getRoomById(created.roomId)
		if (room?.state.phase !== 'active')
			throw new Error('expected active phase')
		expect(room.state.activeGame.phase).toBe('revealed')
	})

	it("doesn't reveal once every connected participant has answered, if a disconnected one hasn't", () => {
		const { service, repository, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joinedOne = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		const joinedTwo = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Tom',
		})
		if (!joinedOne.ok || !joinedTwo.ok) throw new Error('setup failed')

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: {
				difficulty: 'easy',
				scope: 'all',
				questionCount: 10,
				questionDurationMs: undefined,
			},
		})
		if (!started.ok) throw new Error('setup failed')

		service.disconnectMember(created.roomId, joinedTwo.value.memberId)

		service.submitAnswer({
			memberSessionToken: joinedOne.value.memberSessionToken,
			countryId: '840',
		})

		const room = repository.getRoomById(created.roomId)
		if (room?.state.phase !== 'active')
			throw new Error('expected active phase')
		expect(room.state.activeGame.phase).toBe('open')
	})
})

describe('RoomsService fair play', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	function startGroupGame(now?: () => number) {
		const { service, repository, createHostedRoom } = createService({ now })
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'group',
		})
		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: DEFAULT_GAME_CONFIG,
		})
		if (!started.ok) throw new Error('setup failed')

		function getGame() {
			const context = repository.getRoomById(created.roomId)
			if (context?.state.phase !== 'active')
				throw new Error('expected active phase')
			return context.state.activeGame
		}

		function getOpenRound() {
			const game = getGame()
			if (game.phase !== 'open') throw new Error('expected an open round')
			return {
				questionId: game.currentRound.questionId,
				wrongId: game.session.eligibleIds.find(
					id => id !== game.currentRound.questionId,
				)!,
			}
		}

		return { service, created, joined: joined.value, getGame, getOpenRound }
	}

	it('judges and scores answers on the server, by the server clock', () => {
		let clock = 1_000_000
		const { service, created, joined, getGame, getOpenRound } =
			startGroupGame(() => clock)
		const { questionId, wrongId } = getOpenRound()

		clock = 1_003_400
		const right = service.submitAnswer({
			memberSessionToken: joined.memberSessionToken,
			countryId: questionId,
		})
		clock = 1_005_000
		const wrong = service.submitAnswer({
			memberSessionToken: created.memberSessionToken,
			countryId: wrongId,
		})

		expect(right.ok && right.value.acceptedAt).toBe(1_003_400)
		expect(wrong.ok && wrong.value.acceptedAt).toBe(1_005_000)
		const game = getGame()
		if (game.phase !== 'revealed') throw new Error('expected a reveal')
		expect(game.currentRound.submissions[joined.memberId]).toEqual({
			participantId: joined.memberId,
			countryId: questionId,
			submittedAt: 1_003_400,
			isCorrect: true,
			score: 85,
		})
		expect(game.currentRound.submissions[created.memberId]).toEqual({
			participantId: created.memberId,
			countryId: wrongId,
			submittedAt: 1_005_000,
			isCorrect: false,
			score: 0,
		})
		expect(game.participantsById[joined.memberId]?.score).toBe(85)
		expect(game.participantsById[created.memberId]?.score).toBe(0)
	})

	it('keeps the first answer when a second one is rejected', () => {
		const { service, joined, getGame, getOpenRound } = startGroupGame()
		const { questionId, wrongId } = getOpenRound()

		const first = service.submitAnswer({
			memberSessionToken: joined.memberSessionToken,
			countryId: wrongId,
		})
		const second = service.submitAnswer({
			memberSessionToken: joined.memberSessionToken,
			countryId: questionId,
		})

		expect(first.ok).toBe(true)
		expect(second.ok).toBe(false)
		if (second.ok) return
		expect(second.error.code).toBe('participant_already_submitted')
		const game = getGame()
		if (game.phase !== 'open') throw new Error('expected an open round')
		expect(game.currentRound.submissions[joined.memberId]?.countryId).toBe(
			wrongId,
		)
	})

	it("rejects a country outside the game's pool", () => {
		const { service, joined, getGame } = startGroupGame()

		const submitted = service.submitAnswer({
			memberSessionToken: joined.memberSessionToken,
			countryId: '999',
		})

		expect(submitted.ok).toBe(false)
		if (submitted.ok) return
		expect(submitted.error.code).toBe('country_not_eligible')
		const game = getGame()
		if (game.phase !== 'open') throw new Error('expected an open round')
		expect(game.currentRound.submissions[joined.memberId]).toBeUndefined()
	})

	it('rejects an answer once the deadline has revealed the round', () => {
		const { service, joined, getGame, getOpenRound } = startGroupGame()
		const { questionId } = getOpenRound()

		vi.advanceTimersByTime(DEFAULT_GAME_CONFIG.questionDurationMs + 1)
		const submitted = service.submitAnswer({
			memberSessionToken: joined.memberSessionToken,
			countryId: questionId,
		})

		expect(submitted.ok).toBe(false)
		if (submitted.ok) return
		expect(submitted.error.code).toBe('game_not_open')
		const game = getGame()
		if (game.phase !== 'revealed') throw new Error('expected a reveal')
		expect(game.currentRound.submissions[joined.memberId]).toMatchObject({
			countryId: null,
			isCorrect: false,
			score: 0,
		})
	})
})

describe('RoomsService.revealGameRound', () => {
	it('reveals the round for the host in an active classroom-mode room', () => {
		const { service, repository, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: {
				difficulty: 'easy',
				scope: 'all',
				questionCount: 10,
				questionDurationMs: undefined,
			},
		})
		if (!started.ok) throw new Error('setup failed')

		const revealed = service.revealGameRound({
			memberSessionToken: created.memberSessionToken,
		})
		expect(revealed.ok).toBe(true)

		const room = repository.getRoomById(created.roomId)
		if (room?.state.phase !== 'active')
			throw new Error('expected active phase')
		expect(room.state.activeGame.phase).toBe('revealed')
	})

	it('rejects a non-host actor', () => {
		const { service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: DEFAULT_GAME_CONFIG,
		})
		if (!started.ok) throw new Error('setup failed')

		const revealed = service.revealGameRound({
			memberSessionToken: joined.value.memberSessionToken,
		})
		expect(revealed.ok).toBe(false)
		if (revealed.ok) return
		expect(revealed.error).toMatchObject({
			code: 'only_host_can_manage_room',
		})
	})

	it('rejects a group-mode room', () => {
		const { service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'group',
		})

		const joined = service.joinRoom({
			memberName: 'Bob',
			roomCode: created.roomCode,
		})
		if (!joined.ok) throw new Error('setup failed')

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: DEFAULT_GAME_CONFIG,
		})
		if (!started.ok) throw new Error('setup failed')

		const revealed = service.revealGameRound({
			memberSessionToken: created.memberSessionToken,
		})
		expect(revealed.ok).toBe(false)
		if (revealed.ok) return
		expect(revealed.error).toMatchObject({
			code: 'room_not_in_classroom_mode',
		})
	})

	it('rejects a room that has not started a game yet', () => {
		const { service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const revealed = service.revealGameRound({
			memberSessionToken: created.memberSessionToken,
		})
		expect(revealed.ok).toBe(false)
		if (revealed.ok) return
		expect(revealed.error).toMatchObject({ code: 'room_not_active' })
	})
})

describe('RoomsService.advanceGameRound', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	function reachRevealedPhase(options: { questionCount?: number } = {}) {
		const helpers = createService()
		const created = helpers.createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = helpers.service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const started = helpers.service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: {
				difficulty: 'easy',
				scope: 'all',
				questionCount: options.questionCount ?? 10,
				questionDurationMs: undefined,
			},
		})
		if (!started.ok) throw new Error('setup failed')

		const revealed = helpers.service.revealGameRound({
			memberSessionToken: created.memberSessionToken,
		})
		if (!revealed.ok) throw new Error('setup failed')

		return { ...helpers, created, joined }
	}

	it('advances from the revealed stage to the next round for the host', () => {
		const { service, repository, created } = reachRevealedPhase()

		const before = repository.getRoomById(created.roomId)
		if (before?.state.phase !== 'active')
			throw new Error('expected active phase')
		expect(before.state.activeGame.phase).toBe('revealed')

		const advanced = service.advanceGameRound({
			memberSessionToken: created.memberSessionToken,
		})
		expect(advanced.ok).toBe(true)

		const after = repository.getRoomById(created.roomId)
		if (after?.state.phase !== 'active')
			throw new Error('expected active phase')
		expect(after.state.activeGame.phase).toBe('open')
	})

	it('rejects a non-host actor', () => {
		const { service, joined } = reachRevealedPhase()

		const advanced = service.advanceGameRound({
			memberSessionToken: joined.value.memberSessionToken,
		})
		expect(advanced.ok).toBe(false)
		if (advanced.ok) return
		expect(advanced.error).toMatchObject({
			code: 'only_host_can_manage_room',
		})
	})

	it('rejects a group-mode room', () => {
		const { service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'group',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: DEFAULT_GAME_CONFIG,
		})
		if (!started.ok) throw new Error('setup failed')

		const advanced = service.advanceGameRound({
			memberSessionToken: created.memberSessionToken,
		})
		expect(advanced.ok).toBe(false)
		if (advanced.ok) return
		expect(advanced.error).toMatchObject({
			code: 'room_not_in_classroom_mode',
		})
	})

	it('rejects advancing before the round has reached the revealed stage', () => {
		const { service, createHostedRoom } = createService()
		const room = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: room.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const started = service.startGame({
			memberSessionToken: room.memberSessionToken,
			gameConfig: DEFAULT_GAME_CONFIG,
		})
		if (!started.ok) throw new Error('setup failed')

		const advanced = service.advanceGameRound({
			memberSessionToken: room.memberSessionToken,
		})
		expect(advanced.ok).toBe(false)
		if (advanced.ok) return
		expect(advanced.error).toMatchObject({ code: 'game_not_advanceable' })
	})

	it('moves a classroom room to finished once the host advances past the last round', () => {
		const { service, repository, created } = reachRevealedPhase({
			questionCount: 1,
		})

		const before = repository.getRoomById(created.roomId)
		if (before?.state.phase !== 'active')
			throw new Error('expected active phase')
		expect(before.state.activeGame.phase).toBe('revealed')

		const advanced = service.advanceGameRound({
			memberSessionToken: created.memberSessionToken,
		})
		if (!advanced.ok) throw new Error('setup failed')

		const after = repository.getRoomById(created.roomId)
		expect(after?.state.phase).toBe('finished')
	})
})

describe('RoomsService game auto advance', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('auto-reveals the answer once the question deadline passes, in group mode', () => {
		const { repository, service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'group',
		})

		const started = service.startGame({
			gameConfig: DEFAULT_GAME_CONFIG,
			memberSessionToken: created.memberSessionToken,
		})
		if (!started.ok) throw new Error('setup failed')

		const before = repository.getRoomById(created.roomId)
		if (before?.state.phase !== 'active')
			throw new Error('expected active phase')
		expect(before.state.activeGame.phase).toBe('open')

		vi.advanceTimersByTime(DEFAULT_GAME_CONFIG.questionDurationMs + 1)

		const after = repository.getRoomById(created.roomId)
		if (after?.state.phase !== 'active')
			throw new Error('expected active phase')
		expect(after.state.activeGame.phase).toBe('revealed')
	})

	it('auto-reveals the answer once the question deadline passes, in classroom mode', () => {
		const revealDurationMs = 1_000
		const { repository, service, createHostedRoom } = createService({
			revealDurationMs,
		})
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const started = service.startGame({
			gameConfig: DEFAULT_GAME_CONFIG,
			memberSessionToken: created.memberSessionToken,
		})
		if (!started.ok) throw new Error('setup failed')

		vi.advanceTimersByTime(DEFAULT_GAME_CONFIG.questionDurationMs + 1)

		const after = repository.getRoomById(created.roomId)
		if (after?.state.phase !== 'active')
			throw new Error('expected active phase')
		expect(after.state.activeGame.phase).toBe('revealed')
	})

	it("doesn't auto-reveal the answer in classroom mode when no duration was configured", () => {
		const { repository, service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const started = service.startGame({
			gameConfig: {
				difficulty: 'easy',
				scope: 'all',
				questionCount: 10,
				questionDurationMs: undefined,
			},
			memberSessionToken: created.memberSessionToken,
		})
		if (!started.ok) throw new Error('setup failed')

		const before = repository.getRoomById(created.roomId)
		if (before?.state.phase !== 'active')
			throw new Error('expected active phase')
		expect(before.state.activeGame.phase).toBe('open')

		vi.advanceTimersByTime(30_000 + 1)

		const after = repository.getRoomById(created.roomId)
		if (after?.state.phase !== 'active')
			throw new Error('expected active phase')
		expect(after.state.activeGame.phase).toBe('open')
	})

	it('auto-shows the leaderboard once the reveal duration passes, in group mode', () => {
		const revealDurationMs = 1_000
		const { repository, service, createHostedRoom } = createService({
			revealDurationMs,
		})
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'group',
		})

		const started = service.startGame({
			gameConfig: DEFAULT_GAME_CONFIG,
			memberSessionToken: created.memberSessionToken,
		})
		if (!started.ok) throw new Error('setup failed')

		vi.advanceTimersByTime(
			DEFAULT_GAME_CONFIG.questionDurationMs + revealDurationMs + 1,
		)

		const after = repository.getRoomById(created.roomId)
		if (after?.state.phase !== 'active')
			throw new Error('expected active phase')
		expect(after.state.activeGame.phase).toBe('leaderboard')
	})

	it("doesn't auto-advance past the revealed stage in classroom mode", () => {
		const revealDurationMs = 1_000
		const { repository, service, createHostedRoom } = createService({
			revealDurationMs,
		})
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const started = service.startGame({
			gameConfig: DEFAULT_GAME_CONFIG,
			memberSessionToken: created.memberSessionToken,
		})
		if (!started.ok) throw new Error('setup failed')

		vi.advanceTimersByTime(
			DEFAULT_GAME_CONFIG.questionDurationMs + revealDurationMs + 1,
		)

		const after = repository.getRoomById(created.roomId)
		if (after?.state.phase !== 'active')
			throw new Error('expected active phase')

		expect(after.state.activeGame.phase).toBe('revealed')
	})

	it('auto-advances to the next round in group mode', () => {
		const revealDurationMs = 1_000
		const leaderboardDurationMs = 1_000
		const { repository, service, createHostedRoom } = createService({
			revealDurationMs,
			leaderboardDurationMs,
		})
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'group',
		})

		const started = service.startGame({
			gameConfig: DEFAULT_GAME_CONFIG,
			memberSessionToken: created.memberSessionToken,
		})
		if (!started.ok) throw new Error('setup failed')

		vi.advanceTimersByTime(
			DEFAULT_GAME_CONFIG.questionDurationMs +
				revealDurationMs +
				leaderboardDurationMs +
				1,
		)

		const after = repository.getRoomById(created.roomId)
		if (after?.state.phase !== 'active')
			throw new Error('expected active phase')
		expect(after.state.activeGame.phase).toBe('open')
	})

	it('auto-advances through the last round to a finished room, in group mode', () => {
		const commonTTLMs = 1_000
		const { service, repository, createHostedRoom } = createService({
			revealDurationMs: commonTTLMs,
			leaderboardDurationMs: commonTTLMs,
		})
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'group',
		})

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: {
				difficulty: 'easy',
				scope: 'all',
				questionCount: 1,
				questionDurationMs: commonTTLMs,
			},
		})
		if (!started.ok) throw new Error('setup failed')

		vi.advanceTimersByTime(3 * commonTTLMs + 1)

		const room = repository.getRoomById(created.roomId)
		if (room?.state.phase !== 'finished')
			throw new Error(`expected finished phase, got ${room?.state.phase}`)

		expect(room.state.lastGameResult.leaderboard.length).toBeGreaterThan(0)
		expect(room.state.gameHistory).toHaveLength(1)
	})
})

describe('RoomsService room expiry', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('closes the room once every member has disconnected and the empty-room TTL elapses', () => {
		const noConnectedMembersTTLMs = 1_000

		const { service, repository, hooks, createHostedRoom } = createService({
			roomExpireTTL: {
				noConnectedMembersMs: noConnectedMembersTTLMs,
			},
		})
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		service.disconnectMember(created.roomId, created.memberId)
		service.disconnectMember(created.roomId, joined.value.memberId)

		vi.advanceTimersByTime(noConnectedMembersTTLMs - 1)

		expect(hooks.onRoomClosed).not.toHaveBeenCalled()
		expect(repository.getRoomById(created.roomId)).toBeDefined()

		vi.advanceTimersByTime(2)

		expect(hooks.onRoomClosed).toHaveBeenCalledWith(created.roomId, 'expired')
		expect(repository.getRoomById(created.roomId)).toBeUndefined()
	})

	it('cancels a pending expiry once the host reconnects before the TTL elapses', () => {
		const hostDisconnectedInGroupTTLMs = 1_000

		const { service, repository, hooks, createHostedRoom } = createService({
			roomExpireTTL: {
				hostDisconnectedInGroupMs: hostDisconnectedInGroupTTLMs,
			},
		})
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'group',
		})

		service.disconnectMember(created.roomId, created.memberId)

		vi.advanceTimersByTime(hostDisconnectedInGroupTTLMs - 1)

		const resumed = service.resumeHostRoom({
			memberSessionToken: created.memberSessionToken,
		})
		expect(resumed.ok).toBe(true)

		vi.advanceTimersByTime(hostDisconnectedInGroupTTLMs)

		expect(hooks.onRoomClosed).not.toHaveBeenCalled()
		expect(repository.getRoomById(created.roomId)).toBeDefined()
	})

	it('closes a classroom room after the host stays disconnected through an active game', () => {
		const hostDisconnectedInClassroomTTLMs = 1_000

		const { service, hooks, createHostedRoom } = createService({
			roomExpireTTL: {
				hostDisconnectedInClassroomMs: hostDisconnectedInClassroomTTLMs,
			},
		})
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: DEFAULT_GAME_CONFIG,
		})
		if (!started.ok) throw new Error('setup failed')

		service.disconnectMember(created.roomId, created.memberId)

		vi.advanceTimersByTime(hostDisconnectedInClassroomTTLMs - 1)
		expect(hooks.onRoomClosed).not.toHaveBeenCalled()

		vi.advanceTimersByTime(2)
		expect(hooks.onRoomClosed).toHaveBeenCalledWith(created.roomId, 'expired')
	})

	it('keeps a group-mode room alive indefinitely while the host is disconnected mid-game', () => {
		const commonTTLMs = 1_000

		const { service, repository, hooks, createHostedRoom } = createService({
			roomExpireTTL: {
				noConnectedMembersMs: commonTTLMs,
				hostDisconnectedInGroupMs: commonTTLMs,
				hostDisconnectedInClassroomMs: commonTTLMs,
				finishedMs: commonTTLMs,
			},
		})
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'group',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: DEFAULT_GAME_CONFIG,
		})
		if (!started.ok) throw new Error('setup failed')

		service.disconnectMember(created.roomId, created.memberId)

		vi.advanceTimersByTime(commonTTLMs * 3)

		expect(hooks.onRoomClosed).not.toHaveBeenCalled()
		expect(repository.getRoomById(created.roomId)).toBeDefined()
	})
})

describe('RoomsService.resumePlayerRoom', () => {
	it('rejects an unknown token', () => {
		const { service } = createService()

		const resumed = service.resumePlayerRoom({
			memberSessionToken: 'not-a-real-token',
		})

		expect(resumed.ok).toBe(false)
		if (resumed.ok) return
		expect(resumed.error).toMatchObject({ code: 'member_session_not_found' })
	})

	it('rejects a host token', () => {
		const { service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const resumed = service.resumePlayerRoom({
			memberSessionToken: created.memberSessionToken,
		})

		expect(resumed.ok).toBe(false)
		if (resumed.ok) return
		expect(resumed.error).toMatchObject({ code: 'insufficient_permissions' })
	})

	it('reconnects a disconnected player', () => {
		const { service, repository, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		service.disconnectMember(created.roomId, joined.value.memberId)

		const room = repository.getRoomById(created.roomId)
		if (!room) throw new Error('room not created')

		expect(room.state.membersById[joined.value.memberId]?.connected).toBe(
			false,
		)

		const resumed = service.resumePlayerRoom({
			memberSessionToken: joined.value.memberSessionToken,
		})

		expect(resumed.ok).toBe(true)

		const roomAfter = repository.getRoomById(created.roomId)
		if (!roomAfter) throw new Error('room not found')

		expect(
			roomAfter.state.membersById[joined.value.memberId]?.connected,
		).toBe(true)
	})

	it("doesn't error resuming an already-connected member", () => {
		const { service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			memberName: 'Bob',
			roomCode: created.roomCode,
		})
		if (!joined.ok) throw new Error('setup failed')

		const resumed = service.resumePlayerRoom({
			memberSessionToken: joined.value.memberSessionToken,
		})

		expect(resumed.ok).toBe(true)
	})
})

describe('RoomsService.resumeHostRoom', () => {
	it('rejects an unknown token', () => {
		const { service } = createService()

		const resumed = service.resumeHostRoom({
			memberSessionToken: 'not-a-real-token',
		})

		expect(resumed.ok).toBe(false)
		if (resumed.ok) return
		expect(resumed.error).toMatchObject({ code: 'member_session_not_found' })
	})

	it('rejects a player token used against resumeHostRoom', () => {
		const { service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const resumed = service.resumeHostRoom({
			memberSessionToken: joined.value.memberSessionToken,
		})

		expect(resumed.ok).toBe(false)
		if (resumed.ok) return
		expect(resumed.error).toMatchObject({ code: 'insufficient_permissions' })
	})

	it('reconnects a disconnected host', () => {
		const { service, repository, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		service.disconnectMember(created.roomId, created.memberId)

		const room = repository.getRoomById(created.roomId)
		if (!room) throw new Error('room not created')
		expect(room.state.membersById[created.memberId]?.connected).toBe(false)

		const resumed = service.resumeHostRoom({
			memberSessionToken: created.memberSessionToken,
		})

		expect(resumed.ok).toBe(true)

		const roomAfter = repository.getRoomById(created.roomId)
		if (!roomAfter) throw new Error('room not found')
		expect(roomAfter.state.membersById[created.memberId]?.connected).toBe(
			true,
		)
	})

	it("doesn't error resuming an already-connected member", () => {
		const { service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const resumed = service.resumeHostRoom({
			memberSessionToken: created.memberSessionToken,
		})

		expect(resumed.ok).toBe(true)
	})
})

describe('RoomsService.returnToLobby', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('rejects a non-host actor', () => {
		const commonPhaseDurationMs = 1_000

		const { service, createHostedRoom } = createService({
			leaderboardDurationMs: commonPhaseDurationMs,
			revealDurationMs: commonPhaseDurationMs,
		})
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'group',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: {
				difficulty: 'easy',
				scope: 'all',
				questionCount: 1,
				questionDurationMs: commonPhaseDurationMs,
			},
		})
		if (!started.ok) throw new Error('setup failed')

		vi.advanceTimersByTime(3 * commonPhaseDurationMs + 1)

		const returned = service.returnToLobby({
			memberSessionToken: joined.value.memberSessionToken,
		})

		expect(returned.ok).toBe(false)
		if (returned.ok) return
		expect(returned.error).toMatchObject({
			code: 'only_host_can_manage_room',
		})
	})

	it('rejects a room that has not finished yet', () => {
		const { service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const returned = service.returnToLobby({
			memberSessionToken: created.memberSessionToken,
		})

		expect(returned.ok).toBe(false)
		if (returned.ok) return
		expect(returned.error).toMatchObject({ code: 'room_not_finished' })
	})

	it('moves a finished room back to the lobby and allows a second game to start', () => {
		const commonTTLMs = 1_000
		const { service, repository, createHostedRoom } = createService({
			revealDurationMs: commonTTLMs,
			leaderboardDurationMs: commonTTLMs,
		})
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'group',
		})

		const started = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: {
				difficulty: 'easy',
				scope: 'all',
				questionCount: 1,
				questionDurationMs: commonTTLMs,
			},
		})
		if (!started.ok) throw new Error('setup failed')

		vi.advanceTimersByTime(3 * commonTTLMs + 1)

		const finishedRoom = repository.getRoomById(created.roomId)
		if (finishedRoom?.state.phase !== 'finished')
			throw new Error('expected finished phase, setup is broken')

		const returned = service.returnToLobby({
			memberSessionToken: created.memberSessionToken,
		})
		expect(returned.ok).toBe(true)

		const lobbyRoom = repository.getRoomById(created.roomId)
		if (lobbyRoom?.state.phase !== 'lobby')
			throw new Error('expected lobby phase')
		expect(lobbyRoom.state.gameHistory).toHaveLength(1)

		const startedAgain = service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: DEFAULT_GAME_CONFIG,
		})
		expect(startedAgain.ok).toBe(true)
	})
})

describe('RoomsService.terminateRoom', () => {
	it('rejects a non-host actor', () => {
		const { service, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const terminated = service.terminateRoom({
			memberSessionToken: joined.value.memberSessionToken,
		})

		expect(terminated.ok).toBe(false)
		if (terminated.ok) return
		expect(terminated.error).toMatchObject({
			code: 'only_host_can_manage_room',
		})
	})

	it('removes the room and notifies onRoomClosed for the host', () => {
		const { service, repository, hooks, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const terminated = service.terminateRoom({
			memberSessionToken: created.memberSessionToken,
		})

		expect(terminated.ok).toBe(true)
		expect(hooks.onRoomClosed).toHaveBeenCalledWith(
			created.roomId,
			'host_terminated',
		)
		expect(repository.getRoomById(created.roomId)).toBeUndefined()
	})
})

describe('RoomsService.disconnectMember', () => {
	it('is a no-op for an unknown room', () => {
		const { service, hooks } = createService()

		expect(() =>
			service.disconnectMember('unknown-room', 'unknown-member'),
		).not.toThrow()
		expect(hooks.onRoomUpdated).not.toHaveBeenCalled()
	})

	it('is a no-op for an unknown member', () => {
		const { service, hooks, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		expect(() =>
			service.disconnectMember(created.roomId, 'unknown-member'),
		).not.toThrow()
		expect(hooks.onRoomUpdated).not.toHaveBeenCalled()
	})

	it('marks a known member disconnected and notifies the room', () => {
		const { service, repository, hooks, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		hooks.onRoomUpdated.mockClear()

		service.disconnectMember(created.roomId, joined.value.memberId)

		expect(hooks.onRoomUpdated).toHaveBeenCalledTimes(1)
		const room = repository.getRoomById(created.roomId)
		expect(room?.state.membersById[joined.value.memberId]?.connected).toBe(
			false,
		)
	})

	it('is idempotent for a member that already disconnected', () => {
		const { service, hooks, createHostedRoom } = createService()
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		service.disconnectMember(created.roomId, joined.value.memberId)
		hooks.onRoomUpdated.mockClear()

		expect(() =>
			service.disconnectMember(created.roomId, joined.value.memberId),
		).not.toThrow()
		expect(hooks.onRoomUpdated).not.toHaveBeenCalled()
	})
})

describe('RoomsService logging', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	function createLoggedService() {
		const lines: Record<string, unknown>[] = []
		const logger = createLogger('info', {
			write: (line: string) => {
				lines.push(JSON.parse(line))
			},
		})

		return { ...createService({ logger }), lines }
	}

	function startOneQuestionGame(
		helpers: ReturnType<typeof createLoggedService>,
		roomMode: 'group' | 'classroom',
	) {
		const created = helpers.createHostedRoom({ hostName: 'Alice', roomMode })
		const joined = helpers.service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		if (!joined.ok) throw new Error('setup failed')

		const started = helpers.service.startGame({
			memberSessionToken: created.memberSessionToken,
			gameConfig: { ...DEFAULT_GAME_CONFIG, questionCount: 1 },
		})
		if (!started.ok) throw new Error('setup failed')

		return { created, joined: joined.value }
	}

	it('logs room creation with the room id and mode only', () => {
		const { lines, createHostedRoom } = createLoggedService()

		const created = createHostedRoom({ hostName: 'Alice', roomMode: 'group' })

		expect(lines).toEqual([
			{
				level: 'info',
				time: expect.any(String),
				roomId: created.roomId,
				roomMode: 'group',
				event: 'room_created',
			},
		])
	})

	it('logs the start and the end of a classroom game', () => {
		const helpers = createLoggedService()
		const { created } = startOneQuestionGame(helpers, 'classroom')

		const revealed = helpers.service.revealGameRound({
			memberSessionToken: created.memberSessionToken,
		})
		if (!revealed.ok) throw new Error('setup failed')
		const advanced = helpers.service.advanceGameRound({
			memberSessionToken: created.memberSessionToken,
		})
		if (!advanced.ok) throw new Error('setup failed')

		expect(helpers.repository.getRoomById(created.roomId)?.state.phase).toBe(
			'finished',
		)
		expect(helpers.lines.map(line => line.event)).toEqual([
			'room_created',
			'game_started',
			'game_finished',
		])
		expect(helpers.lines[1]).toMatchObject({
			roomId: created.roomId,
			roomMode: 'classroom',
			gameId: expect.any(String),
			participantCount: 1,
			questionCount: 1,
		})
		expect(helpers.lines[2]).toMatchObject({
			roomId: created.roomId,
			roomMode: 'classroom',
			gameId: helpers.lines[1]?.gameId,
			participantCount: 1,
			questionCount: 1,
			durationMs: expect.any(Number),
		})
	})

	it('logs the end of a group game finished by the round timers', () => {
		const helpers = createLoggedService()
		const { created } = startOneQuestionGame(helpers, 'group')

		vi.advanceTimersByTime(120_000)

		expect(helpers.repository.getRoomById(created.roomId)?.state.phase).toBe(
			'finished',
		)
		expect(helpers.lines.at(-1)).toMatchObject({
			event: 'game_finished',
			roomMode: 'group',
			participantCount: 2,
			questionCount: 1,
		})
	})

	it('logs room closure with the reason, phase and member counts', () => {
		const helpers = createLoggedService()
		const { created } = startOneQuestionGame(helpers, 'classroom')

		const terminated = helpers.service.terminateRoom({
			memberSessionToken: created.memberSessionToken,
		})
		if (!terminated.ok) throw new Error('setup failed')

		expect(helpers.lines.at(-1)).toEqual({
			level: 'info',
			time: expect.any(String),
			roomId: created.roomId,
			roomMode: 'classroom',
			reason: 'host_terminated',
			phase: 'active',
			memberCount: 2,
			connectedMemberCount: 2,
			ageMs: expect.any(Number),
			event: 'room_closed',
		})
	})

	it('never logs member names, room codes or session tokens', () => {
		const helpers = createLoggedService()
		const { created, joined } = startOneQuestionGame(helpers, 'group')
		vi.advanceTimersByTime(120_000)
		helpers.service.shutdown('server_shutdown')

		const serialized = JSON.stringify(helpers.lines)
		for (const value of [
			'Alice',
			'Bob',
			created.roomCode,
			created.memberSessionToken,
			joined.memberSessionToken,
		]) {
			expect(serialized).not.toContain(value)
		}
	})
})

describe('RoomsService.getHealthSnapshot', () => {
	it('counts rooms by phase', () => {
		const { service, createHostedRoom } = createService()
		createHostedRoom({ hostName: 'Alice', roomMode: 'classroom' })
		const started = createHostedRoom({ hostName: 'Bob', roomMode: 'group' })
		const startResult = service.startGame({
			memberSessionToken: started.memberSessionToken,
			gameConfig: DEFAULT_GAME_CONFIG,
		})
		if (!startResult.ok) throw new Error('setup failed')

		expect(service.getHealthSnapshot()).toEqual({
			roomCount: 2,
			connectedSessionCount: 2,
			roomsByPhase: { lobby: 1, active: 1, finished: 0 },
		})
	})
})

describe('RoomsService serverNow', () => {
	it('puts the injected clock into join and resume responses', () => {
		const serverNow = 1_760_000_000_000
		const { service, createHostedRoom } = createService({
			now: () => serverNow,
		})
		const created = createHostedRoom({
			hostName: 'Alice',
			roomMode: 'classroom',
		})

		const joined = service.joinRoom({
			roomCode: created.roomCode,
			memberName: 'Bob',
		})
		const hostResumed = service.resumeHostRoom({
			memberSessionToken: created.memberSessionToken,
		})
		if (!joined.ok || !hostResumed.ok) throw new Error('setup failed')
		const playerResumed = service.resumePlayerRoom({
			memberSessionToken: joined.value.memberSessionToken,
		})
		if (!playerResumed.ok) throw new Error('setup failed')

		expect(joined.value.serverNow).toBe(serverNow)
		expect(hostResumed.value.serverNow).toBe(serverNow)
		expect(playerResumed.value.serverNow).toBe(serverNow)
	})
})
