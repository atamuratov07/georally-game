import {
	DEFAULT_SPRINT_CONFIG,
	SPRINT_LENGTHS,
	type SprintConfig,
	type SprintLength,
} from '@georally/game-domain/singleplayer/recall-sprint'
import { isGameRegions } from '@georally/game-domain'
import { regionsKey } from '../shared/personalBests'
import { readGameRegions, setRegions } from '../shared/setupParams'

function isLength(value: unknown): value is SprintLength {
	return SPRINT_LENGTHS.includes(value as SprintLength)
}

export function isSprintConfig(value: unknown): value is SprintConfig {
	if (typeof value !== 'object' || value === null) {
		return false
	}

	const config = value as Record<keyof SprintConfig, unknown>
	return isGameRegions(config.regions) && isLength(config.length)
}

export function toSearchParams(config: SprintConfig): URLSearchParams {
	return setRegions(
		new URLSearchParams({ length: config.length }),
		config.regions,
	)
}

export function readSetupConfig(searchParams: URLSearchParams): SprintConfig {
	const length = searchParams.get('length')
	return {
		regions: readGameRegions(searchParams),
		length: isLength(length) ? length : DEFAULT_SPRINT_CONFIG.length,
	}
}

export function bestKey(config: SprintConfig): string {
	return `recall-sprint:${regionsKey(config.regions)}:${config.length}`
}
