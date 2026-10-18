import { countryCatalog, type CountryInfo } from '@georally/country-catalog'
import type {
	ActiveGameHostView,
	GameHostSubmissionView,
	GameLeaderboardEntry,
	GameParticipantView,
	GameResult,
	GameView,
} from '@georally/game-domain/multiplayer/game'
import type { VisibleMemberInfo } from '@georally/game-domain/multiplayer/room'
import { getMemberName, getMembersById } from './roomSelectors'

export interface CurrentRoundView {
	startedAt: number
	deadlineAt: number | null
	questionCountryId: string
	currentQuestionNumber: number
	questionCount: number
}

export interface NamedLeaderboardEntry extends GameLeaderboardEntry {
	name: string
}

export interface HostParticipantStanding {
	participantId: string
	name: string
	connected: boolean
	rank: number
	score: number
	correctCount: number
	submittedAt: number | null
	submission: GameHostSubmissionView | null
}

export function getLeaderboardEntries(
	game:
		| Pick<GameParticipantView, 'leaderboard'>
		| Pick<GameResult, 'leaderboard'>,
	members: readonly VisibleMemberInfo[],
	limit?: number,
): NamedLeaderboardEntry[] {
	const entries = game.leaderboard ?? []
	const visibleEntries =
		limit === undefined ? entries : entries.slice(0, limit)

	return visibleEntries.map(entry => ({
		...entry,
		name: getMemberName(members, entry.participantId),
	}))
}

export function getHostStandings(
	game: ActiveGameHostView,
	members: readonly VisibleMemberInfo[],
): HostParticipantStanding[] {
	const membersById = getMembersById(members)
	return game.participants
		.map(participant => {
			const participantInfo = membersById.get(participant.participantId)
			if (!participantInfo) return
			return {
				participantId: participant.participantId,
				name: participantInfo.name,
				connected: participantInfo.connected,
				rank: participant.rank,
				score: participant.score,
				correctCount: participant.correctCount,
				submittedAt:
					'submittedAt' in participant ? participant?.submittedAt : null,
				submission:
					'submission' in participant ? participant?.submission : null,
			}
		})
		.filter(standing => !!standing)
}

export function getCurrentRound(game: GameView): CurrentRoundView | null {
	if (game.phase === 'completed') {
		return null
	}

	return {
		startedAt: game.startedAt,
		deadlineAt: game.deadlineAt,
		questionCountryId: game.questionCountryId,
		currentQuestionNumber: game.currentQuestionNumber,
		questionCount: game.questionCount,
	}
}

export function getCountryInfo(
	countryId: string | null | undefined,
): CountryInfo | null {
	if (!countryId) {
		return null
	}

	return countryCatalog.countriesById.get(countryId) ?? null
}

export function getPromptCountryInfo(game: GameView): CountryInfo | null {
	return game.phase === 'open' ? getCountryInfo(game.questionCountryId) : null
}

export function getCorrectCountryInfo(game: GameView): CountryInfo | null {
	return game.phase === 'revealed' || game.phase === 'leaderboard'
		? getCountryInfo(game.correctCountryId)
		: null
}

export function getTargetCountryInfo(game: GameView): CountryInfo | null {
	return game.phase === 'open'
		? getPromptCountryInfo(game)
		: getCorrectCountryInfo(game)
}
