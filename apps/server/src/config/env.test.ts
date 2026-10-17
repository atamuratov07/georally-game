import { describe, expect, it } from 'vitest'

import { parseEnv } from './env.js'

describe('parseEnv', () => {
	it('logs stats every 60 seconds by default', () => {
		expect(parseEnv({}).statsIntervalMs).toBe(60_000)
	})

	it('reads the stats interval from STATS_INTERVAL_MS', () => {
		expect(parseEnv({ STATS_INTERVAL_MS: '1000' }).statsIntervalMs).toBe(
			1_000,
		)
	})

	it('rejects a stats interval below one second', () => {
		expect(() => parseEnv({ STATS_INTERVAL_MS: '999' })).toThrow()
	})
})
