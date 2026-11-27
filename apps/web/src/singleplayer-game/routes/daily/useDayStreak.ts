import type { Streak } from '@georally/game-domain'
import type { RouteState } from '@georally/game-domain/singleplayer/routes'
import { useEffect, useMemo, useState } from 'react'
import { loadReviewDays } from '@/mastery/bridge/reviewDays'
import { dayStreak } from './streak'

export interface DayStreak {
	streak: Streak
	reviewDays: ReadonlySet<string>
}

export function useDayStreak(
	entries: ReadonlyMap<number, RouteState>,
	today: string,
): DayStreak | null {
	const [reviewDays, setReviewDays] = useState<string[] | null>(null)

	useEffect(() => {
		let live = true
		void loadReviewDays().then(days => {
			if (live) setReviewDays(days)
		})
		return () => {
			live = false
		}
	}, [today])

	return useMemo(
		() =>
			reviewDays && {
				streak: dayStreak(entries, reviewDays, today),
				reviewDays: new Set(reviewDays),
			},
		[entries, reviewDays, today],
	)
}
