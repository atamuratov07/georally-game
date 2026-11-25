import type {
	RevealedGameState,
	RoundOutcome,
} from '@georally/game-domain/singleplayer/locate'
import type { AnswerInput, SingleAnswerOutcome } from '../types'
import { gradeSingle, type Grader } from './grade'

export const LOCATE_SLOW_MS = 20_000

const RESULTS: Record<RoundOutcome, SingleAnswerOutcome['result']> = {
	correct: 'correct',
	outOfAttempts: 'wrong',
	giveUp: 'giveUp',
}

export function locateOutcome(
	round: RevealedGameState,
	input: AnswerInput | null,
): SingleAnswerOutcome {
	const wrongPicks = round.wrongPicks.length
	return {
		shape: 'single',
		result: RESULTS[round.outcome],
		responseMs: round.resolvedAt - round.startedAt,
		wrongAttempts:
			round.outcome === 'outOfAttempts' ? wrongPicks - 1 : wrongPicks,
		input,
	}
}

export const gradeLocate: Grader = (outcome, kind) =>
	gradeSingle(outcome, kind, LOCATE_SLOW_MS)
