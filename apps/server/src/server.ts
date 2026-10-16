import { createServer as createHttpServer } from 'node:http'

import type { Express } from 'express'
import { GAME_NAMESPACE } from '@georally/game-protocol'
import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
} from '@georally/game-protocol'
import { Server as SocketIOServer } from 'socket.io'

import type { GameNamespace, GameSocketData } from './features/rooms/types.js'

export interface RealtimeServerOptions {
	app: Express
	corsOrigins: string[]
}

export function createRealtimeServer({
	app,
	corsOrigins,
}: RealtimeServerOptions) {
	const httpServer = createHttpServer(app)
	const io = new SocketIOServer<
		ClientToServerEvents,
		ServerToClientEvents,
		InterServerEvents,
		GameSocketData
	>(httpServer, {
		cors: {
			origin: corsOrigins,
			credentials: true,
		},
		serveClient: false,
	})

	const gameNamespace: GameNamespace = io.of(GAME_NAMESPACE)

	return {
		httpServer,
		io,
		gameNamespace,
	}
}
