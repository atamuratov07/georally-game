import {
	getRevealedId,
	type GameState,
} from '@georally/game-domain/singleplayer/locate'
import { useMemo, useRef, useState } from 'react'
import type {
	CasualOutcome,
	ReviewOffer,
} from '@/mastery/bridge/reportCasualOutcomes'
import {
	useRoundEvents,
	type RoundEventHandlers,
} from '../shared/useRoundEvents'

export function useLocateBridge(
	state: GameState | null,
	restored: boolean,
): ReviewOffer | null {
	const [offer, setOffer] = useState<ReviewOffer | null>(null)
	const outcomes = useRef<CasualOutcome[]>([])
	const game = useRef(0)

	const handlers = useMemo<RoundEventHandlers<GameState>>(
		() => ({
			onStart: () => {
				game.current += 1
				outcomes.current = []
				setOffer(null)
			},
			onReveal: state => {
				const countryId = getRevealedId(state)
				if (state.phase !== 'revealed' || !countryId) return
				outcomes.current.push({
					countryId,
					skillId: 'locate',
					missed:
						state.outcome !== 'correct' || state.wrongPicks.length > 0,
				})
			},
			onFinish: () => {
				const reported = outcomes.current
				const finishedGame = game.current
				if (reported.length === 0) return
				import('@/mastery/bridge/reportCasualOutcomes')
					.then(bridge => bridge.reportCasualOutcomes(reported))
					.then(next => {
						if (game.current === finishedGame) setOffer(next)
					})
					.catch(error => console.error(error))
			},
		}),
		[],
	)

	useRoundEvents(state, restored, handlers)
	return offer
}
