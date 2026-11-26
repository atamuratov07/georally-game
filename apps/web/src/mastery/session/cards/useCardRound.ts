import type { AnswerInput } from '@georally/mastery'
import { useState } from 'react'

// A card's round lives until the session's turn moves on, even when the same card comes back.
export function useCardRound<Round>(
	turn: number,
	fresh: Round | null,
	report: (round: Round, input: AnswerInput | null) => void,
) {
	const [played, setPlayed] = useState<{ turn: number; round: Round }>()
	const round = played?.turn === turn ? played.round : fresh

	function resolve(next: Round, input: AnswerInput | null) {
		setPlayed({ turn, round: next })
		report(next, input)
	}

	return { round, resolve }
}
