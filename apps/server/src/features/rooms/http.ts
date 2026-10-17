import type { Request, Response, Router } from 'express'
import type {
	CreateRoomResponse,
	LookupRoomResponse,
	RoomProtocolError,
} from '@georally/game-protocol'
import {
	createRoomRequestSchema,
	lookupRoomRequestSchema,
} from '@georally/game-protocol'

import type { RoomsService } from './service.js'
import { respondWithError, respondWithSuccess } from '../../http/responses.js'
import type { ProtocolErrorReporter } from '../../observability/protocolErrors.js'

export interface RegisterRoomRoutesOptions {
	router: Router
	roomsService: RoomsService
	reportProtocolError: ProtocolErrorReporter
}

export function registerRoomRoutes({
	router,
	roomsService,
	reportProtocolError,
}: RegisterRoomRoutesOptions): void {
	function fail(
		request: Request,
		response: Response,
		error: RoomProtocolError,
	): void {
		reportProtocolError('http_error', error, {
			method: request.method,
			route: request.route?.path,
		})
		respondWithError(response, error)
	}

	router.post('/rooms', (request, response) => {
		const parsed = createRoomRequestSchema.safeParse(request.body)
		if (!parsed.success) {
			return fail(request, response, { code: 'invalid_payload' })
		}

		const createdRoom = roomsService.createRoom(parsed.data)
		if (!createdRoom.ok) {
			return fail(request, response, createdRoom.error)
		}

		respondWithSuccess<CreateRoomResponse>(response, 201, createdRoom.value)
	})

	router.get('/rooms/:roomCode', (request, response) => {
		const parsed = lookupRoomRequestSchema.safeParse({
			roomCode: request.params.roomCode,
		})
		if (!parsed.success) {
			return fail(request, response, { code: 'invalid_payload' })
		}

		respondWithSuccess<LookupRoomResponse>(
			response,
			200,
			roomsService.lookupRoom(parsed.data.roomCode),
		)
	})
}
