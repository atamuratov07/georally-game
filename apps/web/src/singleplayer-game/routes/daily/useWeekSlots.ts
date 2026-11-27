import type { RouteState } from '@georally/game-domain/singleplayer/routes'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { weekdayKey } from '@/shared/time/weekdays'
import type { PunchSlot } from '@/shared/widgets/streak/WeekPunchCard'
import { dailyWeek } from './streak'

export function useWeekSlots(
	entries: ReadonlyMap<number, RouteState>,
	reviewDays: ReadonlySet<string>,
	today: string,
): PunchSlot[] {
	const { t } = useTranslation()
	return useMemo(
		() =>
			dailyWeek(entries, reviewDays, today).map(slot => ({
				...slot,
				label: t(`common.weekdayShort.${weekdayKey(slot.day)}`),
			})),
		[entries, reviewDays, today, t],
	)
}
