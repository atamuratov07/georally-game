import { monitorEventLoopDelay } from 'node:perf_hooks'

import type { Logger } from './logger.js'

const NANOSECONDS_PER_MILLISECOND = 1_000_000
const BYTES_PER_MEGABYTE = 1024 * 1024
const EVENT_LOOP_DELAY_RESOLUTION_MS = 10

export interface ProcessStats {
	eventLoopDelayMs: {
		p50: number
		p99: number
	}
	rssMb: number
	heapUsedMb: number
	invalidPayloadCount: number
}

function round(value: number): number {
	return Math.round(value * 100) / 100
}

export function createRuntimeStats() {
	const eventLoopDelay = monitorEventLoopDelay({
		resolution: EVENT_LOOP_DELAY_RESOLUTION_MS,
	})
	eventLoopDelay.enable()
	let invalidPayloadCount = 0

	function readEventLoopDelayMs(percentile: number): number {
		const intervalMs =
			eventLoopDelay.percentile(percentile) / NANOSECONDS_PER_MILLISECOND
		return round(Math.max(0, intervalMs - EVENT_LOOP_DELAY_RESOLUTION_MS))
	}

	function read(): ProcessStats {
		const memory = process.memoryUsage()

		return {
			eventLoopDelayMs: {
				p50: readEventLoopDelayMs(50),
				p99: readEventLoopDelayMs(99),
			},
			rssMb: round(memory.rss / BYTES_PER_MEGABYTE),
			heapUsedMb: round(memory.heapUsed / BYTES_PER_MEGABYTE),
			invalidPayloadCount,
		}
	}

	function readAndReset(): ProcessStats {
		const stats = read()
		eventLoopDelay.reset()
		invalidPayloadCount = 0
		return stats
	}

	return {
		recordInvalidPayload(): void {
			invalidPayloadCount += 1
		},
		read,
		readAndReset,
		stop(): void {
			eventLoopDelay.disable()
		},
	}
}

export type RuntimeStats = ReturnType<typeof createRuntimeStats>

export interface StatsReporterOptions {
	logger: Logger
	intervalMs: number
	collect: () => Record<string, unknown>
}

export function startStatsReporter({
	logger,
	intervalMs,
	collect,
}: StatsReporterOptions): () => void {
	const timer = setInterval(() => {
		logger.info(collect(), 'stats')
	}, intervalMs)
	timer.unref()

	return () => clearInterval(timer)
}
