import { playableCountryPool } from '@georally/country-catalog'

import { createApp } from './app.js'
import { parseEnv } from './config/env.js'
import { createRoomPublisher } from './features/rooms/publisher.js'
import { RoomsRepository } from './features/rooms/repository.js'
import { RoomsService } from './features/rooms/service.js'
import { registerRoomHandlers } from './features/rooms/socket.js'
import { createRealtimeServer } from './server.js'
import { registerRoomRoutes } from './features/rooms/http.js'

const env = parseEnv(process.env)
const repository = new RoomsRepository()

let getHealthSnapshot = (): Record<string, unknown> => ({})

const { app, apiRouter } = createApp({
	corsOrigins: env.corsOrigins,
	getHealthSnapshot: () => getHealthSnapshot(),
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
	hooks: {
		onRoomUpdated: (roomId, options) => {
			publisher.publishRoomSnapshots(roomId, options)
		},
		onRoomClosed: (roomId, reason) => {
			publisher.publishRoomClosed(roomId, reason)
		},
	},
})

getHealthSnapshot = () => roomsService.getHealthSnapshot()

registerRoomHandlers({
	namespace: gameNamespace,
	roomsService,
})
registerRoomRoutes({ router: apiRouter, roomsService })

httpServer.listen(env.port, env.host, () => {
	console.log(`Listening on http://${env.host}:${env.port}`)
})

function shutdown(signal: NodeJS.Signals) {
	console.log(`Shutting down on ${signal}`)

	roomsService.shutdown('server_shutdown')
	io.close()
	httpServer.close(error => {
		if (error) {
			console.error('Failed to close HTTP server cleanly.', error)
			process.exit(1)
		}

		process.exit(0)
	})
}

process.once('SIGINT', () => shutdown('SIGINT'))
process.once('SIGTERM', () => shutdown('SIGTERM'))
