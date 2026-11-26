import { useMemo, useRef, useState } from 'react'
import type {
	CasualOutcome,
	ReviewOffer,
} from '@/mastery/bridge/reportCasualOutcomes'
import {
	useRoundEvents,
	type RoundEventHandlers,
	type RoundsLike,
} from './useRoundEvents'

export function useReviewBridge<State extends RoundsLike>(
	state: State | null,
	restored: boolean,
	toOutcome: (revealed: State) => CasualOutcome | null,
): ReviewOffer | null {
	const [offer, setOffer] = useState<ReviewOffer | null>(null)
	const outcomes = useRef<CasualOutcome[]>([])
	const game = useRef(0)

	const handlers = useMemo<RoundEventHandlers<State>>(
		() => ({
			onStart: () => {
				game.current += 1
				outcomes.current = []
				setOffer(null)
			},
			onReveal: revealed => {
				const outcome = toOutcome(revealed)
				if (outcome) outcomes.current.push(outcome)
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
		[toOutcome],
	)

	useRoundEvents(state, restored, handlers)
	return offer
}
