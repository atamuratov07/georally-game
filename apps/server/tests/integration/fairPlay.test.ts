import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { DEFAULT_GAME_CONFIG } from '@georally/game-domain/multiplayer'
import type {
	CreateRoomResponse,
	SubmitAnswerRequest,
} from '@georally/game-protocol'

import { trackRoomClient } from '../roomClient'
import { bootstrapServer } from '../setup'

type TestServer = Awaited<ReturnType<typeof bootstrapServer>>

describe('fair play over the socket', () => {
	let server: TestServer

	beforeAll(async () => {
		server = await bootstrapServer({
			REVEAL_DURATION_MS: '1000',
			LEADERBOARD_DURATION_MS: '1000',
		})
	})

	afterEach(() => {
		server.resetBetweenTests()
	})

	afterAll(async () => {
		await server.teardown()
	})

	async function startGroupGame() {
		const response = await request(server.httpServer)
			.post('/api/rooms')
			.send({ hostName: 'Alice', roomMode: 'group' })
			.expect(201)
		const created: CreateRoomResponse = response.body.data

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

		function getGame() {
			const context = server.repository.getRoomById(created.roomId)
			if (context?.state.phase !== 'active')
				throw new Error('expected active phase')
			return context.state.activeGame
		}

		const game = getGame()
		if (game.phase !== 'open') throw new Error('expected an open round')
		const questionId = game.currentRound.questionId
		const wrongId = game.session.eligibleIds.find(id => id !== questionId)!

		return {
			created,
			host: { client: host, socket: hostSocket },
			player: { client: player, socket: playerSocket, joined: joined.data },
			questionId,
			wrongId,
			getGame,
		}
	}

	it('ignores the verdict, score and time a client adds to its answer', async () => {
		const { created, host, player, questionId, wrongId, getGame } =
			await startGroupGame()
		const forged = {
			isCorrect: true,
			score: 1_000,
			scoreAwarded: 1_000,
			submittedAt: 0,
		}

		const right = await player.socket.emitWithAck('game:submit-answer', {
			countryId: questionId,
			...forged,
			isCorrect: false,
		} as SubmitAnswerRequest)
		const wrong = await host.socket.emitWithAck('game:submit-answer', {
			countryId: wrongId,
			...forged,
		} as SubmitAnswerRequest)

		if (!right.ok || !wrong.ok) throw new Error('setup failed')
		const game = getGame()
		if (game.phase !== 'revealed') throw new Error('expected a reveal')
		const rightSubmission =
			game.currentRound.submissions[player.joined.memberId]
		expect(rightSubmission).toMatchObject({
			countryId: questionId,
			submittedAt: right.data.acceptedAt,
			isCorrect: true,
		})
		expect(rightSubmission?.score).toBeGreaterThan(0)
		expect(rightSubmission?.score).toBeLessThanOrEqual(100)
		expect(game.currentRound.submissions[created.memberId]).toMatchObject({
			countryId: wrongId,
			submittedAt: wrong.data.acceptedAt,
			isCorrect: false,
			score: 0,
		})
	})

	it("keeps other players' answers and the leaderboard from players until the leaderboard phase", async () => {
		const { host, player, questionId, wrongId, getGame } =
			await startGroupGame()

		const hostAnswer = await host.socket.emitWithAck('game:submit-answer', {
			countryId: wrongId,
		})
		if (!hostAnswer.ok) throw new Error('setup failed')
		const playerAnswer = await player.socket.emitWithAck(
			'game:submit-answer',
			{ countryId: questionId },
		)
		if (!playerAnswer.ok) throw new Error('setup failed')
		expect(getGame().phase).toBe('revealed')
		await player.client.waitFor(
			() => player.client.view()?.activeGame?.phase === 'revealed',
		)

		const beforeLeaderboard = player.client.received.map(received =>
			JSON.stringify(received.payload),
		)
		expect(player.client.view()?.activeGame).toMatchObject({
			leaderboard: null,
			viewerRank: null,
		})
		for (const payload of beforeLeaderboard) {
			expect(payload).not.toContain(`"countryId":"${wrongId}"`)
			expect(payload).not.toContain('"leaderboard":[')
		}

		await player.client.waitFor(
			() => player.client.view()?.activeGame?.phase === 'leaderboard',
		)
		const leaderboard = player.client.view()?.activeGame?.leaderboard
		expect(leaderboard).toHaveLength(2)
		for (const received of player.client.received) {
			expect(JSON.stringify(received.payload)).not.toContain(
				`"countryId":"${wrongId}"`,
			)
		}
	})
})
