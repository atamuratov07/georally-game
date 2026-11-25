import { playableCountryPool } from '@georally/country-catalog'
import {
	loadToday,
	recordAnswer,
	type Answer,
	type AnswerOutcome,
	type CardId,
} from '@georally/mastery'
import { useCallback, useEffect, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
	trackReviewCardAnswered,
	trackReviewSessionStart,
} from '@/shared/analytics/track'
import { localDay } from '@/shared/time/localDay'
import { mastery } from '../container'
import { sessionReducer } from './sessionReducer'

export function useMasterySession() {
	const { t } = useTranslation()
	const [session, dispatch] = useReducer(sessionReducer, {
		status: 'loading',
	})

	useEffect(() => {
		let ignore = false
		loadToday(mastery, {
			pool: playableCountryPool,
			day: localDay(Date.now()),
		}).then(
			({ cards, sessionPlan }) => {
				if (ignore) return
				dispatch({ type: 'loaded', plan: sessionPlan, now: Date.now() })
				if (sessionPlan.length === 0) return
				const known = new Set(cards.map(card => card.id))
				const dueCount = sessionPlan.filter(id => known.has(id)).length
				trackReviewSessionStart({
					dueCount,
					newCount: sessionPlan.length - dueCount,
				})
			},
			(error: unknown) => {
				console.error(error)
				if (!ignore) dispatch({ type: 'unavailable' })
			},
		)
		return () => {
			ignore = true
		}
	}, [])

	const answer = useCallback(
		(cardId: CardId, outcome: AnswerOutcome, at: number) => {
			async function save(answer: Answer) {
				dispatch({ type: 'saving' })
				try {
					const { card, entry } = await recordAnswer(mastery, answer)
					trackReviewCardAnswered({
						skill: card.skillId,
						rating: entry.rating,
						kind: entry.kind,
						input: entry.outcome.input,
						responseTimeMs: entry.outcome.responseMs,
					})
					dispatch({
						type: 'saved',
						cardId: answer.cardId,
						due: card.scheduling.due,
						kind: entry.kind,
						now: answer.now,
					})
				} catch (error) {
					console.error(error)
					dispatch({ type: 'saveFailed' })
					toast.error(t('review.saveFailed'), {
						action: {
							label: t('common.retry'),
							onClick: () => void save(answer),
						},
					})
				}
			}
			void save({ cardId, outcome, entryId: crypto.randomUUID(), now: at })
		},
		[t],
	)

	const ready = useCallback(
		() => dispatch({ type: 'ready', now: Date.now() }),
		[],
	)
	const next = useCallback(
		() => dispatch({ type: 'next', now: Date.now() }),
		[],
	)

	return { session, answer, ready, next }
}
