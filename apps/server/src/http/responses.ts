import type { ErrorRequestHandler, Response } from 'express'
import type { Ack, RoomProtocolError } from '@georally/game-protocol'

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

export const handleHttpError: ErrorRequestHandler = (
	error,
	_request,
	response,
	next,
) => {
	if (response.headersSent) {
		return next(error)
	}

	if (error?.type === 'entity.parse.failed') {
		return respondWithError(response, { code: 'invalid_payload' })
	}

	console.error('Unhandled HTTP error', error)
	respondWithError(response, { code: 'internal_error' })
}
