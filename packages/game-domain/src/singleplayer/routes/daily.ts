import { addDays, daysBetween, weekday } from '../../streak'
import type { GameDifficulty } from '../../shared/types'

export function dailyNumber(launch: string, today: string): number {
	return daysBetween(launch, today) + 1
}

export function dailyDay(launch: string, number: number): string {
	return addDays(launch, number - 1)
}

const LEVEL_BY_WEEKDAY: readonly GameDifficulty[] = [
	'easy',
	'easy',
	'medium',
	'medium',
	'medium',
	'medium',
	'hard',
]

export function dailyLevel(day: string): GameDifficulty {
	return LEVEL_BY_WEEKDAY[weekday(day)]
}
