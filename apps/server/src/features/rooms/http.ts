import type { Router } from 'express'
import type {
	CreateRoomResponse,
	LookupRoomResponse,
} from '@georally/game-protocol'
import {
	createRoomRequestSchema,
	lookupRoomRequestSchema,
} from '@georally/game-protocol'

import type { RoomsService } from './service.js'
import { respondWithError, respondWithSuccess } from '../../http/responses.js'

export interface RegisterRoomRoutesOptions {
	router: Router
	roomsService: RoomsService
}

export function registerRoomRoutes({
	router,
	roomsService,
}: RegisterRoomRoutesOptions): void {
	router.post('/rooms', (request, response) => {
		const parsed = createRoomRequestSchema.safeParse(request.body)
		if (!parsed.success) {
			return respondWithError(response, { code: 'invalid_payload' })
		}

		const createdRoom = roomsService.createRoom(parsed.data)
		if (!createdRoom.ok) {
			return respondWithError(response, createdRoom.error)
		}

		respondWithSuccess<CreateRoomResponse>(response, 201, createdRoom.value)
	})

	router.get('/rooms/:roomCode', (request, response) => {
		const parsed = lookupRoomRequestSchema.safeParse({
			roomCode: request.params.roomCode,
		})
		if (!parsed.success) {
			return respondWithError(response, { code: 'invalid_payload' })
		}

		respondWithSuccess<LookupRoomResponse>(
			response,
			200,
			roomsService.lookupRoom(parsed.data.roomCode),
		)
	})
}
