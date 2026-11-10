import type { SprintLength } from './types'

const BASE_MS = 60_000
const PER_COUNTRY_MS = 1_250
const STEP_MS = 30_000
const LENGTH_FACTOR: Record<SprintLength, number> = {
	short: 1,
	medium: 2,
	long: 3,
}

export function sprintDurationMs(
	countryCount: number,
	length: SprintLength,
): number {
	const base =
		Math.round((BASE_MS + PER_COUNTRY_MS * countryCount) / STEP_MS) * STEP_MS
	return base * LENGTH_FACTOR[length]
}
