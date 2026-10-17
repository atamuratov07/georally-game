import { pino, type DestinationStream, type Logger } from 'pino'

export type { Logger }

export const LOG_LEVELS = [
	'fatal',
	'error',
	'warn',
	'info',
	'debug',
	'trace',
	'silent',
] as const

export type LogLevel = (typeof LOG_LEVELS)[number]

export const LOG_REDACT_PATHS = [
	'memberSessionToken',
	'*.memberSessionToken',
	'hostName',
	'memberName',
	'name',
]

export function createLogger(
	level: LogLevel,
	destination: DestinationStream = pino.destination({ dest: 1, sync: true }),
): Logger {
	return pino(
		{
			level,
			base: null,
			messageKey: 'event',
			timestamp: pino.stdTimeFunctions.isoTime,
			formatters: {
				level: label => ({ level: label }),
			},
			redact: LOG_REDACT_PATHS,
		},
		destination,
	)
}

export function createSilentLogger(): Logger {
	return pino({ level: 'silent' })
}
