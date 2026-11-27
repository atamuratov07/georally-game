import { dailyRoutes } from '@georally/country-catalog/daily-routes'
import {
	dailyNumber,
	type DailyRouteEntry,
	type RouteState,
} from '@georally/game-domain/singleplayer/routes'
import { localDay, localDayStart } from '@/shared/time/localDay'

export type DailyToday =
	| { kind: 'soon'; opensAt: number }
	| { kind: 'over' }
	| {
			kind: 'puzzle'
			number: number
			entry: DailyRouteEntry
			game: RouteState | null
			carried: boolean
	  }

export function dailyToday(
	now: number,
	entries: ReadonlyMap<number, RouteState>,
): DailyToday {
	const { launch, puzzles } = dailyRoutes
	const today = dailyNumber(launch, localDay(now).key)
	const puzzle = (number: number, carried: boolean): DailyToday => ({
		kind: 'puzzle',
		number,
		entry: puzzles[number - 1],
		game: entries.get(number) ?? null,
		carried,
	})

	const yesterday = today - 1
	if (
		entries.get(yesterday)?.phase === 'playing' &&
		yesterday >= 1 &&
		yesterday <= puzzles.length
	) {
		return puzzle(yesterday, true)
	}
	if (today < 1) return { kind: 'soon', opensAt: localDayStart(launch) }
	if (today > puzzles.length) return { kind: 'over' }
	return puzzle(today, false)
}
