import { dailyRoutes } from '@georally/country-catalog/daily-routes'
import { addDays, deriveStreak, weekday } from '@georally/game-domain'
import {
	dailyDay,
	dailyNumber,
	isPerfect,
	type RouteState,
} from '@georally/game-domain/singleplayer/routes'
import type { PunchStatus } from '@/shared/widgets/streak/WeekPunchCard'

type Entries = ReadonlyMap<number, RouteState>

const solved = (game: RouteState | undefined) =>
	game?.phase === 'finished' && game.outcome === 'solved'

export function dayStreak(
	entries: Entries,
	reviewDays: readonly string[],
	today: string,
) {
	const days = [...entries]
		.filter(([, game]) => solved(game))
		.map(([number]) => dailyDay(dailyRoutes.launch, number))
	return deriveStreak([...days, ...reviewDays], today)
}

export function dailyWeek(
	entries: Entries,
	reviewDays: ReadonlySet<string>,
	today: string,
): { day: string; status: PunchStatus }[] {
	const monday = addDays(today, -weekday(today))
	return Array.from({ length: 7 }, (_, i) => {
		const day = addDays(monday, i)
		const number = dailyNumber(dailyRoutes.launch, day)
		const entry = dailyRoutes.puzzles[number - 1]
		const status = entry
			? slotStatus(entries.get(number), entry.par, day, today)
			: 'none'
		return {
			day,
			status:
				status !== 'perfect' && status !== 'solved' && reviewDays.has(day)
					? 'reviewed'
					: status,
		}
	})
}

function slotStatus(
	game: RouteState | undefined,
	par: number,
	day: string,
	today: string,
): PunchStatus {
	if (game?.phase === 'finished') {
		if (game.outcome === 'gaveUp') return 'missed'
		return isPerfect({ par }, game) ? 'perfect' : 'solved'
	}
	if (day > today) return 'future'
	if (day === today || (game && addDays(day, 1) === today)) return 'open'
	return 'missed'
}
