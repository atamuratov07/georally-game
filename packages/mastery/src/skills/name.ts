import {
	getWrongNames,
	type RevealedGameState,
	type RoundOutcome,
} from '@georally/game-domain/singleplayer/name-it'
import type { AnswerInput, SingleAnswerOutcome } from '../types'
import { gradeSingle, type Grader } from './grade'

export const NAME_SLOW_MS = 12_000

const RESULTS: Record<RoundOutcome, SingleAnswerOutcome['result']> = {
	correct: 'correct',
	timeUp: 'timeUp',
	giveUp: 'giveUp',
}

export function nameOutcome(
	round: RevealedGameState,
	input: AnswerInput | null,
): SingleAnswerOutcome {
	return {
		shape: 'single',
		result: RESULTS[round.outcome],
		responseMs: round.resolvedAt - round.startedAt,
		wrongAttempts: getWrongNames(round).length,
		input,
	}
}

export const gradeName: Grader = (outcome, kind) =>
	gradeSingle(outcome, kind, NAME_SLOW_MS)
