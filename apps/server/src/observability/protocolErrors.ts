import type { RoomProtocolError } from '@georally/game-protocol'

import type { Logger } from './logger.js'

export type ProtocolErrorEvent = 'ack_error' | 'http_error'

export type ProtocolErrorReporter = (
	event: ProtocolErrorEvent,
	error: RoomProtocolError,
	fields?: Record<string, unknown>,
) => void

export interface ProtocolErrorReporterOptions {
	logger: Logger
	onInvalidPayload: () => void
}

export function createProtocolErrorReporter({
	logger,
	onInvalidPayload,
}: ProtocolErrorReporterOptions): ProtocolErrorReporter {
	return (event, error, fields = {}) => {
		if (error.code === 'invalid_payload') {
			onInvalidPayload()
			return
		}

		const entry = { ...fields, code: error.code }
		if (error.code === 'internal_error') {
			logger.error(entry, event)
			return
		}

		logger.warn(entry, event)
	}
}
