import { selectEligibleCountryIds } from '../../catalog/selectors'
import type { CountryPool } from '../../catalog/types'
import type { SessionPreparationError } from '../../shared/errors'
import { err, ok, type Result } from '../../shared/result'
import { sprintDurationMs } from './duration'
import type { SprintConfig, SprintSession } from './types'

export function prepareSprintSession(
	pool: CountryPool,
	config: SprintConfig,
): Result<SprintSession, SessionPreparationError> {
	const countryIds = selectEligibleCountryIds(pool, {
		scope: config.scope,
		difficulty: 'hard',
	}).sort()

	if (countryIds.length === 0) {
		return err({ code: 'no_eligible_countries' })
	}
	return ok({
		config,
		countryIds,
		durationMs: sprintDurationMs(countryIds.length, config.length),
	})
}
