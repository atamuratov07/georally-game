import type { RouteState } from '@georally/game-domain/singleplayer/routes'
import { isRouteConfig } from './config'

function isTimed(value: unknown): boolean {
	if (typeof value !== 'object' || value === null) {
		return false
	}
	const { countryId, at } = value as Record<string, unknown>
	return typeof countryId === 'string' && typeof at === 'number'
}

function isTimedList(value: unknown): boolean {
	return Array.isArray(value) && value.every(isTimed)
}

function hasValidRoute(record: Record<string, unknown>): boolean {
	return (
		typeof record.startId === 'string' &&
		typeof record.targetId === 'string' &&
		isTimedList(record.guesses) &&
		isTimedList(record.hints) &&
		typeof record.startedAt === 'number'
	)
}

export function isRouteGame(game: unknown): game is RouteState {
	if (typeof game !== 'object' || game === null) {
		return false
	}

	const record = game as Record<string, unknown>
	if (!isRouteConfig(record.config)) {
		return false
	}

	switch (record.phase) {
		case 'idle':
			return true
		case 'playing':
			return hasValidRoute(record)
		case 'finished':
			return (
				hasValidRoute(record) &&
				typeof record.finishedAt === 'number' &&
				(record.outcome === 'solved' || record.outcome === 'gaveUp')
			)
		default:
			return false
	}
}
