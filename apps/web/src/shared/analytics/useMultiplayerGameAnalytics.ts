import { useEffect, useRef } from 'react'
import type {
	RoomHostView,
	RoomPlayerView,
} from '@georally/game-domain/multiplayer'
import type {
	GameHostView,
	GameParticipantView,
} from '@georally/game-domain/multiplayer/game'
import {
	trackMultiplayerGameEnd,
	trackGameEntered,
	trackMultiplayerQuestionAnswered,
} from './track'

type AnalyzableRoomView = RoomPlayerView | RoomHostView

function isParticipantGame(
	activeGame: GameParticipantView | GameHostView,
): activeGame is GameParticipantView {
	return 'viewerScore' in activeGame
}

export function useMultiplayerGameAnalytics(
	room: AnalyzableRoomView | null,
): void {
	const enteredGameIdRef = useRef<string | null>(null)
	const lastQuestionTrackedRef = useRef<number | null>(null)
	const endedGameIdRef = useRef<string | null>(null)

	useEffect(() => {
		if (!room) {
			return
		}

		if (room.phase === 'active' && room.activeGame) {
			const activeGame = room.activeGame
			const roomMode = room.roomMode
			const role = room.viewerRole === 'host' ? 'host' : 'player'

			if (enteredGameIdRef.current !== activeGame.gameId) {
				enteredGameIdRef.current = activeGame.gameId
				lastQuestionTrackedRef.current = null
				trackGameEntered({
					roomMode,
					role,
					questionCount: activeGame.questionCount,
					regions: activeGame.regions,
					participantCount: activeGame.participantCount,
				})
			}

			if (
				isParticipantGame(activeGame) &&
				(activeGame.phase === 'revealed' ||
					activeGame.phase === 'leaderboard') &&
				activeGame.viewerSubmission &&
				'isCorrect' in activeGame.viewerSubmission &&
				lastQuestionTrackedRef.current !== activeGame.currentQuestionNumber
			) {
				lastQuestionTrackedRef.current = activeGame.currentQuestionNumber
				trackMultiplayerQuestionAnswered({
					roomMode,
					role,
					questionNumber: activeGame.currentQuestionNumber,
					isCorrect: activeGame.viewerSubmission.isCorrect,
					responseTimeMs:
						activeGame.viewerSubmission.submittedAt != null
							? activeGame.viewerSubmission.submittedAt -
								activeGame.startedAt
							: undefined,
				})
			}
		}

		if (
			room.phase === 'finished' &&
			endedGameIdRef.current !== room.lastGameResult.gameId
		) {
			endedGameIdRef.current = room.lastGameResult.gameId
			const result = room.lastGameResult
			const durationMs =
				result.rounds.length > 0
					? result.finishedAt - result.rounds[0].startedAt
					: undefined

			if ('viewerLeaderboardEntry' in room) {
				const entry = room.viewerLeaderboardEntry
				const questionsAnswered = result.rounds.filter(
					round =>
						round.submissions[room.viewerMemberId]?.submittedAt != null,
				).length

				trackMultiplayerGameEnd({
					roomMode: room.roomMode,
					role: room.viewerRole,
					roundsPlayed: result.rounds.length,
					durationMs,
					participantCount: result.leaderboard.length,
					score: entry?.score,
					correctCount: entry?.correctCount,
					rank: entry?.rank,
					questionsAnswered,
				})
			} else {
				trackMultiplayerGameEnd({
					roomMode: room.roomMode,
					role: 'host',
					roundsPlayed: result.rounds.length,
					durationMs,
					participantCount: result.leaderboard.length,
				})
			}
		}
	}, [room])
}
