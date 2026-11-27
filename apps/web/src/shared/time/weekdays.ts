import { weekday } from '@georally/game-domain'

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export function weekdayKey(day: string): (typeof WEEKDAYS)[number] {
	return WEEKDAYS[weekday(day)]
}
