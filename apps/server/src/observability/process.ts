import type { Logger } from './logger.js'

export function registerFatalHandlers(logger: Logger): void {
	process.on('uncaughtException', error => {
		logger.fatal({ err: error }, 'uncaught_exception')
		process.exit(1)
	})

	process.on('unhandledRejection', reason => {
		logger.fatal({ err: reason }, 'unhandled_rejection')
		process.exit(1)
	})
}
