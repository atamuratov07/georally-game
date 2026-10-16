import { playableCountryPool } from '@georally/country-catalog'
import request from 'supertest'

import { parseEnv } from '../src/config/env'
import { createApp } from '../src/app'
import { createRealtimeServer } from '../src/server'
import { createRoomPublisher } from '../src/features/rooms/publisher'
import { RoomsRepository } from '../src/features/rooms/repository'
import { RoomsService } from '../src/features/rooms/service'
import { registerRoomHandlers } from '../src/features/rooms/socket'
import { registerRoomRoutes } from '../src/features/rooms/http'
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client'
import type { AddressInfo } from 'net'
import {
	GAME_NAMESPACE,
	type ClientToServerEvents,
	type CreateRoomRequest,
	type CreateRoomResponse,
	type ServerToClientEvents,
} from '@georally/game-protocol'

export type RoomClientSocket = ClientSocket<
	ServerToClientEvents,
	ClientToServerEvents
>

export async function bootstrapServer() {
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

	await new Promise<void>(resolve => {
		httpServer.listen(resolve)
	})

	const port = (httpServer.address() as AddressInfo).port

	const connectedClients: RoomClientSocket[] = []

	const connectClient = async () => {
		const client = ioc(`http://localhost:${port}${GAME_NAMESPACE}`)
		connectedClients.push(client)

		await new Promise<void>((resolve, reject) => {
			client.once('connect', resolve)
			client.once('connect_error', reject)
		})

		return client
	}

	const createRoomAsHost = async (body: CreateRoomRequest) => {
		const response = await request(httpServer)
			.post('/api/rooms')
			.send(body)
			.expect(201)

		const created: CreateRoomResponse = response.body.data

		const hostSocket = await connectClient()
		const resumed = await hostSocket.emitWithAck('room:host-resume', {
			memberSessionToken: created.memberSessionToken,
		})
		if (!resumed.ok) throw new Error('host resume failed')
		return { hostSocket, created }
	}

	const resetBetweenTests = (): void => {
		for (const client of connectedClients) {
			client.close()
		}
		connectedClients.length = 0
		roomsService.shutdown('server_shutdown')
	}

	const teardown = async (): Promise<void> => {
		for (const client of connectedClients) {
			client.close()
		}
		roomsService.shutdown('server_shutdown')
		io.close()
		await new Promise(resolve => httpServer.close(resolve))
	}

	return {
		httpServer,
		resetBetweenTests,
		connectClient,
		createRoomAsHost,
		teardown,
	}
}
