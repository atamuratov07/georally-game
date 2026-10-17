import { describe, expect, it, vi } from 'vitest'

import { createLogger } from './logger.js'
import { createProtocolErrorReporter } from './protocolErrors.js'

function createReporter() {
	const lines: Record<string, unknown>[] = []
	const onInvalidPayload = vi.fn()
	const report = createProtocolErrorReporter({
		logger: createLogger('debug', {
			write: (line: string) => {
				lines.push(JSON.parse(line))
			},
		}),
		onInvalidPayload,
	})

	return { report, lines, onInvalidPayload }
}

describe('createProtocolErrorReporter', () => {
	it('counts invalid_payload instead of logging it', () => {
		const { report, lines, onInvalidPayload } = createReporter()

		report(
			'ack_error',
			{ code: 'invalid_payload' },
			{ socketEvent: 'room:join' },
		)

		expect(onInvalidPayload).toHaveBeenCalledTimes(1)
		expect(lines).toEqual([])
	})

	it('logs domain errors as warnings with the code and fields', () => {
		const { report, lines, onInvalidPayload } = createReporter()

		report(
			'ack_error',
			{ code: 'room_not_found' },
			{ socketEvent: 'room:join', roomId: undefined },
		)

		expect(onInvalidPayload).not.toHaveBeenCalled()
		expect(lines).toEqual([
			{
				level: 'warn',
				time: expect.any(String),
				event: 'ack_error',
				socketEvent: 'room:join',
				code: 'room_not_found',
			},
		])
	})

	it('logs internal_error as an error', () => {
		const { report, lines } = createReporter()

		report(
			'http_error',
			{ code: 'internal_error' },
			{ err: new Error('boom') },
		)

		expect(lines[0]).toMatchObject({
			level: 'error',
			event: 'http_error',
			code: 'internal_error',
			err: { message: 'boom' },
		})
	})
})
