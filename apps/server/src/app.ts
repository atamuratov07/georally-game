import cors from 'cors'
import express, { Router } from 'express'
import { createHttpErrorHandler } from './http/responses.js'
import type { ProtocolErrorReporter } from './observability/protocolErrors.js'

export interface CreateAppOptions {
	corsOrigins: string[]
	getHealthSnapshot?: () => Record<string, unknown>
	reportProtocolError: ProtocolErrorReporter
}

export function createApp(options: CreateAppOptions) {
	const app = express()
	const apiRouter = Router()

	app.disable('x-powered-by')

	app.get('/health', (_request, response) => {
		response.json({
			status: 'ok',
			service: 'georally-server',
			timestamp: Date.now(),
			...options.getHealthSnapshot?.(),
		})
	})

	app.use(
		'/api',
		cors({ origin: options.corsOrigins }),
		(_request, response, next) => {
			response.set('Cache-Control', 'no-store')
			next()
		},
		express.json(),
		apiRouter,
	)
	app.use(createHttpErrorHandler(options.reportProtocolError))

	return { app, apiRouter }
}
