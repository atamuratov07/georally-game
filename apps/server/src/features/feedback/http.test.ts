import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'

import { createApp } from '../../app.js'
import { createLogger } from '../../observability/logger.js'
import { registerFeedbackRoutes } from './http.js'

const telegram = { botToken: '123:secret-token', chatId: '-1001' }

const feedback = {
	category: 'map_data',
	message: 'Kosovo is missing from the Europe quiz',
	contact: 'player@example.com',
	reaction: 'negative',
	context: { locale: 'ru', path: '/ru/name-it', countryId: '688' },
}

function createTestApp() {
	const logLines: Record<string, unknown>[] = []
	const logger = createLogger('debug', {
		write: (line: string) => {
			logLines.push(JSON.parse(line))
		},
	})
	const { app, apiRouter } = createApp({
		corsOrigins: [],
		reportProtocolError: vi.fn(),
	})
	registerFeedbackRoutes({
		router: apiRouter,
		telegram,
		logger,
		reportProtocolError: vi.fn(),
	})

	return { app, logLines }
}

describe('POST /api/feedback', () => {
	it('forwards the feedback with its context to the Telegram chat', async () => {
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(Response.json({ ok: true }))
		const { app } = createTestApp()

		await request(app)
			.post('/api/feedback')
			.set('User-Agent', 'TestBrowser/1.0')
			.send(feedback)
			.expect(201, { ok: true, data: {} })

		const [url, init] = fetchSpy.mock.calls[0]!
		expect(url).toBe(
			'https://api.telegram.org/bot123:secret-token/sendMessage',
		)
		const body = JSON.parse(String(init?.body))
		expect(body.chat_id).toBe('-1001')
		expect(body.text).toContain('🗺️ Map data · 😕')
		expect(body.text).toContain(feedback.message)
		expect(body.text).toContain('📮 player@example.com')
		expect(body.text).toContain('ru · /ru/name-it · country 688')
		expect(body.text).toContain('TestBrowser/1.0')
	})

	it('answers feedback_unavailable when Telegram rejects the message, without logging the token or the feedback', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			Response.json(
				{ ok: false, description: 'Bad Request: chat not found' },
				{ status: 400 },
			),
		)
		const { app, logLines } = createTestApp()

		await request(app)
			.post('/api/feedback')
			.send(feedback)
			.expect(503, { ok: false, error: { code: 'feedback_unavailable' } })

		expect(logLines).toContainEqual(
			expect.objectContaining({
				event: 'feedback_delivery_failed',
				failure: 'rejected',
				status: 400,
				description: 'Bad Request: chat not found',
			}),
		)
		const logged = JSON.stringify(logLines)
		expect(logged).not.toContain('secret-token')
		expect(logged).not.toContain(feedback.message)
		expect(logged).not.toContain(feedback.contact)
	})

	it('accepts a filled honeypot without contacting Telegram', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch')
		const { app } = createTestApp()

		await request(app)
			.post('/api/feedback')
			.send({ ...feedback, honeypot: 'https://spam.example' })
			.expect(201)

		expect(fetchSpy).not.toHaveBeenCalled()
	})
})
