import type { SprintState } from '@georally/game-domain/singleplayer/recall-sprint'
import { createGameStore } from '../shared/gameStore'
import { isSprintConfig } from './config'

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every(item => typeof item === 'string')
}

function hasValidProgress(record: Record<string, unknown>): boolean {
	const { countryIds, found } = record
	if (
		!isStringArray(countryIds) ||
		countryIds.length === 0 ||
		!isStringArray(found) ||
		typeof record.durationMs !== 'number' ||
		typeof record.startedAt !== 'number' ||
		typeof record.deadlineAt !== 'number'
	) {
		return false
	}

	const regional = new Set(countryIds)
	return found.every(countryId => regional.has(countryId))
}

function isSprintGame(game: unknown): game is SprintState {
	if (typeof game !== 'object' || game === null) {
		return false
	}

	const record = game as Record<string, unknown>
	if (!isSprintConfig(record.config)) {
		return false
	}

	switch (record.phase) {
		case 'idle':
			return true
		case 'running':
			return hasValidProgress(record)
		case 'finished':
			return (
				hasValidProgress(record) &&
				(record.endedBy === 'timeUp' ||
					record.endedBy === 'complete' ||
					record.endedBy === 'finished')
			)
		default:
			return false
	}
}

export const sprintGameStore = createGameStore(
	'georally.singleplayer.recall-sprint',
	isSprintGame,
)
