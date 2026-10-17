import type { ErrorRequestHandler, Response } from 'express'
import type { Ack, RoomProtocolError } from '@georally/game-protocol'

import type { ProtocolErrorReporter } from '../observability/protocolErrors.js'

function statusForError(error: RoomProtocolError): number {
	switch (error.code) {
		case 'invalid_payload':
			return 400
		case 'internal_error':
			return 500
		default:
			return 422
	}
}

export function respondWithError(
	response: Response,
	error: RoomProtocolError,
): void {
	const body: Ack<never> = { ok: false, error }
	response.status(statusForError(error)).json(body)
}

export function respondWithSuccess<T>(
	response: Response,
	status: number,
	data: T,
): void {
	const body: Ack<T> = { ok: true, data }
	response.status(status).json(body)
}

export function createHttpErrorHandler(
	reportProtocolError: ProtocolErrorReporter,
): ErrorRequestHandler {
	return (error, request, response, next) => {
		if (response.headersSent) {
			return next(error)
		}

		if (error?.type === 'entity.parse.failed') {
			reportProtocolError('http_error', { code: 'invalid_payload' })
			return respondWithError(response, { code: 'invalid_payload' })
		}

		reportProtocolError(
			'http_error',
			{ code: 'internal_error' },
			{ err: error, method: request.method, route: request.route?.path },
		)
		respondWithError(response, { code: 'internal_error' })
	}
}
