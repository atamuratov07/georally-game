import { afterEach, describe, expect, it, vi } from 'vitest'

import { createLogger } from './logger.js'
import { createRuntimeStats, startStatsReporter } from './stats.js'

describe('createRuntimeStats', () => {
	it('reports event loop delay, memory and the invalid payload count', () => {
		const stats = createRuntimeStats()

		stats.recordInvalidPayload()
		stats.recordInvalidPayload()

		const snapshot = stats.read()
		stats.stop()

		expect(snapshot).toEqual({
			eventLoopDelayMs: {
				p50: expect.any(Number),
				p99: expect.any(Number),
			},
			rssMb: expect.any(Number),
			heapUsedMb: expect.any(Number),
			invalidPayloadCount: 2,
		})
		expect(snapshot.rssMb).toBeGreaterThan(0)
		expect(snapshot.heapUsedMb).toBeGreaterThan(0)
		expect(Number.isFinite(snapshot.eventLoopDelayMs.p50)).toBe(true)
		expect(Number.isFinite(snapshot.eventLoopDelayMs.p99)).toBe(true)
	})

	it('reports near-zero event loop delay while idle, without the sampling interval', async () => {
		const stats = createRuntimeStats()

		await new Promise(resolve => setTimeout(resolve, 200))
		const snapshot = stats.read()
		stats.stop()

		expect(snapshot.eventLoopDelayMs.p50).toBeLessThan(5)
	})

	it('reports a blocked event loop in p99', async () => {
		const stats = createRuntimeStats()
		await new Promise(resolve => setTimeout(resolve, 30))

		Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 60)
		await new Promise(resolve => setTimeout(resolve, 30))
		const snapshot = stats.readAndReset()
		stats.stop()

		expect(snapshot.eventLoopDelayMs.p99).toBeGreaterThanOrEqual(50)
	})

	it('keeps counting on read and starts over after readAndReset', () => {
		const stats = createRuntimeStats()

		stats.recordInvalidPayload()
		expect(stats.read().invalidPayloadCount).toBe(1)
		expect(stats.read().invalidPayloadCount).toBe(1)

		expect(stats.readAndReset().invalidPayloadCount).toBe(1)
		expect(stats.read().invalidPayloadCount).toBe(0)
		stats.stop()
	})
})

describe('startStatsReporter', () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	it('logs a stats line on every interval until stopped', () => {
		vi.useFakeTimers()
		const lines: Record<string, unknown>[] = []
		const logger = createLogger('info', {
			write: (line: string) => {
				lines.push(JSON.parse(line))
			},
		})
		let collected = 0

		const stop = startStatsReporter({
			logger,
			intervalMs: 60_000,
			collect: () => ({ roomCount: ++collected }),
		})

		vi.advanceTimersByTime(59_999)
		expect(lines).toHaveLength(0)

		vi.advanceTimersByTime(1)
		vi.advanceTimersByTime(60_000)
		expect(lines).toMatchObject([
			{ level: 'info', event: 'stats', roomCount: 1 },
			{ level: 'info', event: 'stats', roomCount: 2 },
		])

		stop()
		vi.advanceTimersByTime(120_000)
		expect(lines).toHaveLength(2)
	})
})
