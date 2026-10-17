import { describe, expect, it } from 'vitest'

import { createLogger, type LogLevel } from './logger.js'

function createCapturingLogger(level: LogLevel = 'info') {
	const lines: Record<string, unknown>[] = []
	const logger = createLogger(level, {
		write: (line: string) => {
			lines.push(JSON.parse(line))
		},
	})

	return { logger, lines }
}

describe('createLogger', () => {
	it('writes one JSON object per event with an ISO time, a level label and the event name', () => {
		const { logger, lines } = createCapturingLogger()

		logger.info({ roomId: 'room-1' }, 'room_created')

		expect(lines).toHaveLength(1)
		expect(lines[0]).toEqual({
			level: 'info',
			time: expect.stringMatching(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
			),
			roomId: 'room-1',
			event: 'room_created',
		})
	})

	it('drops events below the configured level', () => {
		const { logger, lines } = createCapturingLogger('warn')

		logger.info('room_created')
		logger.warn('ack_error')

		expect(lines.map(line => line.event)).toEqual(['ack_error'])
	})

	it('includes child bindings on every line', () => {
		const { logger, lines } = createCapturingLogger()

		logger.child({ roomId: 'room-1', roomMode: 'group' }).info('game_started')

		expect(lines[0]).toMatchObject({
			roomId: 'room-1',
			roomMode: 'group',
			event: 'game_started',
		})
	})

	it('redacts session tokens and member names', () => {
		const { logger, lines } = createCapturingLogger()

		logger.info(
			{
				memberSessionToken: 'secret-token',
				session: { memberSessionToken: 'nested-token' },
				hostName: 'Alice',
				memberName: 'Bob',
				name: 'Carol',
			},
			'leak_attempt',
		)

		const serialized = JSON.stringify(lines[0])
		for (const value of [
			'secret-token',
			'nested-token',
			'Alice',
			'Bob',
			'Carol',
		]) {
			expect(serialized).not.toContain(value)
		}
		expect(lines[0]).toMatchObject({
			memberSessionToken: '[Redacted]',
			session: { memberSessionToken: '[Redacted]' },
			hostName: '[Redacted]',
			memberName: '[Redacted]',
			name: '[Redacted]',
		})
	})

	it('serializes errors passed as err with message and stack', () => {
		const { logger, lines } = createCapturingLogger()

		logger.error({ err: new Error('boom') }, 'room_advance_failed')

		expect(lines[0]).toMatchObject({
			level: 'error',
			event: 'room_advance_failed',
			err: {
				type: 'Error',
				message: 'boom',
				stack: expect.stringContaining('Error: boom'),
			},
		})
	})
})
