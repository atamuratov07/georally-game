import express from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'

import { createHttpErrorHandler } from './responses.js'

function createTestApp() {
	const reportProtocolError = vi.fn()
	const app = express()

	app.post('/rooms/:roomCode', express.json(), () => {
		throw new Error('boom')
	})
	app.use(createHttpErrorHandler(reportProtocolError))

	return { app, reportProtocolError }
}

describe('createHttpErrorHandler', () => {
	it('answers malformed JSON with invalid_payload and reports it', async () => {
		const { app, reportProtocolError } = createTestApp()

		const response = await request(app)
			.post('/rooms/ABC123')
			.set('Content-Type', 'application/json')
			.send('{bad')
			.expect(400)

		expect(response.body).toEqual({
			ok: false,
			error: { code: 'invalid_payload' },
		})
		expect(reportProtocolError).toHaveBeenCalledWith('http_error', {
			code: 'invalid_payload',
		})
	})

	it('answers a thrown error with internal_error and reports the error with the route pattern, not the URL', async () => {
		const { app, reportProtocolError } = createTestApp()

		const response = await request(app)
			.post('/rooms/ABC123')
			.send({})
			.expect(500)

		expect(response.body).toEqual({
			ok: false,
			error: { code: 'internal_error' },
		})
		expect(reportProtocolError).toHaveBeenCalledWith(
			'http_error',
			{ code: 'internal_error' },
			{
				err: expect.objectContaining({ message: 'boom' }),
				method: 'POST',
				route: '/rooms/:roomCode',
			},
		)
		expect(JSON.stringify(reportProtocolError.mock.calls)).not.toContain(
			'ABC123',
		)
	})
})
