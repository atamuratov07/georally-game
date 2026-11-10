import {
	DEFAULT_SPRINT_CONFIG,
	SPRINT_LENGTHS,
	type SprintConfig,
	type SprintLength,
} from '@georally/game-domain/singleplayer/recall-sprint'
import { isScope, readScope } from '../shared/setupParams'

function isLength(value: unknown): value is SprintLength {
	return SPRINT_LENGTHS.includes(value as SprintLength)
}

export function isSprintConfig(value: unknown): value is SprintConfig {
	if (typeof value !== 'object' || value === null) {
		return false
	}

	const config = value as Record<keyof SprintConfig, unknown>
	return isScope(config.scope) && isLength(config.length)
}

export function toSearchParams(config: SprintConfig): URLSearchParams {
	return new URLSearchParams({ scope: config.scope, length: config.length })
}

export function readSetupConfig(searchParams: URLSearchParams): SprintConfig {
	const length = searchParams.get('length')
	return {
		scope: readScope(searchParams, DEFAULT_SPRINT_CONFIG.scope),
		length: isLength(length) ? length : DEFAULT_SPRINT_CONFIG.length,
	}
}
