import { daysBetween } from './days'

export interface Streak {
	current: number
	best: number
	todayActive: boolean
}

export function deriveStreak(
	activeDays: Iterable<string>,
	today: string,
): Streak {
	const days = [...new Set(activeDays)].filter(day => day <= today).sort()

	let run = 0
	let best = 0
	days.forEach((day, i) => {
		run = i > 0 && daysBetween(days[i - 1], day) === 1 ? run + 1 : 1
		best = Math.max(best, run)
	})

	const last = days.at(-1)
	const alive = last !== undefined && daysBetween(last, today) <= 1
	return {
		current: alive ? run : 0,
		best,
		todayActive: last === today,
	}
}
