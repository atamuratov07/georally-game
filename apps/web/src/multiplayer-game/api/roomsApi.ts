import type {
	Ack,
	CreateRoomRequest,
	CreateRoomResponse,
	LookupRoomRequest,
	LookupRoomResponse,
} from '@georally/game-protocol'
import { toGatewayError } from './errors'
import { i18n } from '../../shared/i18n/setup'

const REQUEST_TIMEOUT_MS = 5000

function buildApiUrl(path: string): string {
	const envUrl = import.meta.env.VITE_GAME_SERVER_ORIGIN?.trim()
	const origin = envUrl ? envUrl.replace(/\/$/, '') : ''
	return `${origin}/api${path}`
}

async function requestJson<TResponse>(
	path: string,
	init: { method?: 'GET' | 'POST'; body?: unknown } = {},
): Promise<TResponse> {
	let response: Response
	try {
		response = await fetch(buildApiUrl(path), {
			method: init.method ?? 'GET',
			headers:
				init.body === undefined
					? undefined
					: { 'Content-Type': 'application/json' },
			body: init.body === undefined ? undefined : JSON.stringify(init.body),
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		})
	} catch (error) {
		throw toGatewayError(error)
	}

	let ack: Ack<TResponse>
	try {
		ack = await response.json()
	} catch {
		throw toGatewayError(new Error(i18n.t('gatewayErrors.transport_error')))
	}

	if (ack.ok) {
		return ack.data
	}

	throw ack.error
}

export function createRoom(
	payload: CreateRoomRequest,
): Promise<CreateRoomResponse> {
	return requestJson('/rooms', { method: 'POST', body: payload })
}

export function lookupRoom(
	payload: LookupRoomRequest,
): Promise<LookupRoomResponse> {
	return requestJson(`/rooms/${encodeURIComponent(payload.roomCode)}`)
}
