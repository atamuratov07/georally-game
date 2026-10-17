import { playableCountryPool } from '@georally/country-catalog'

import { createApp } from './app.js'
import { parseEnv } from './config/env.js'
import { createRoomPublisher } from './features/rooms/publisher.js'
import { RoomsRepository } from './features/rooms/repository.js'
import { RoomsService } from './features/rooms/service.js'
import { registerRoomHandlers } from './features/rooms/socket.js'
import { createRealtimeServer } from './server.js'
import { registerRoomRoutes } from './features/rooms/http.js'
import { createLogger } from './observability/logger.js'
import { registerFatalHandlers } from './observability/process.js'
import { createProtocolErrorReporter } from './observability/protocolErrors.js'
import {
	createRuntimeStats,
	startStatsReporter,
} from './observability/stats.js'

const env = parseEnv(process.env)
const logger = createLogger(env.logLevel)
registerFatalHandlers(logger)

const stats = createRuntimeStats()
const reportProtocolError = createProtocolErrorReporter({
	logger,
	onInvalidPayload: stats.recordInvalidPayload,
})
const repository = new RoomsRepository()

let getHealthSnapshot = (): Record<string, unknown> => ({})

const { app, apiRouter } = createApp({
	corsOrigins: env.corsOrigins,
	getHealthSnapshot: () => getHealthSnapshot(),
	reportProtocolError,
})

const { httpServer, io, gameNamespace } = createRealtimeServer({
	app,
	corsOrigins: env.corsOrigins,
})

const publisher = createRoomPublisher({
	namespace: gameNamespace,
	repository,
})

const roomsService = new RoomsService({
	countryPool: playableCountryPool,
	repository,
	revealDurationMs: env.revealDurationMs,
	leaderboardDurationMs: env.leaderboardDurationMs,
	roomCapacityLimit: env.roomCapacityLimit,
	roomExpireTTL: {
		noConnectedMembersMs: env.roomNoConnectedMembersTTL,
		hostDisconnectedInGroupMs: env.roomHostDisconnectedInGroupTTL,
		hostDisconnectedInClassroomMs: env.roomHostDisconnectedInClassroomTTL,
		finishedMs: env.roomFinishedTTL,
	},
	logger,
	hooks: {
		onRoomUpdated: (roomId, options) => {
			publisher.publishRoomSnapshots(roomId, options)
		},
		onRoomClosed: (roomId, reason) => {
			publisher.publishRoomClosed(roomId, reason)
		},
	},
})

getHealthSnapshot = () => ({
	...roomsService.getHealthSnapshot(),
	...stats.read(),
})

registerRoomHandlers({
	namespace: gameNamespace,
	roomsService,
	reportProtocolError,
	logger,
})
registerRoomRoutes({ router: apiRouter, roomsService, reportProtocolError })

const stopStatsReporter = startStatsReporter({
	logger,
	intervalMs: env.statsIntervalMs,
	collect: () => ({
		...roomsService.getHealthSnapshot(),
		...stats.readAndReset(),
	}),
})

httpServer.listen(env.port, env.host, () => {
	logger.info(
		{
			host: env.host,
			port: env.port,
			nodeVersion: process.version,
			logLevel: env.logLevel,
			statsIntervalMs: env.statsIntervalMs,
			roomCapacityLimit: env.roomCapacityLimit,
		},
		'server_started',
	)
})

function shutdown(signal: NodeJS.Signals) {
	logger.info({ signal }, 'server_stopping')

	stopStatsReporter()
	roomsService.shutdown('server_shutdown')
	io.close()
	httpServer.close(error => {
		if (error) {
			logger.error({ err: error }, 'server_close_failed')
			process.exit(1)
		}

		process.exit(0)
	})
}

process.once('SIGINT', () => shutdown('SIGINT'))
process.once('SIGTERM', () => shutdown('SIGTERM'))
