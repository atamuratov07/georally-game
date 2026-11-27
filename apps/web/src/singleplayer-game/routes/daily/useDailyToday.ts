import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { localDay } from '@/shared/time/localDay'
import { loadDailyEntries } from './dailyStore'
import { dailyToday } from './dailyToday'
import { stubContent } from './stubContent'
import { useDayStreak } from './useDayStreak'
import { useWeekSlots } from './useWeekSlots'

const NO_DAYS: ReadonlySet<string> = new Set()

// Null until the review days are read.
export function useDailyToday(now: number) {
	const { t } = useTranslation()
	const [entries] = useState(loadDailyEntries)
	const today = localDay(now).key
	const dayStreak = useDayStreak(entries, today)
	const slots = useWeekSlots(entries, dayStreak?.reviewDays ?? NO_DAYS, today)

	if (!dayStreak) return null
	return {
		played: entries.size > 0,
		ticket: stubContent(dailyToday(now, entries), now, t),
		streak: dayStreak.streak,
		slots,
	}
}
