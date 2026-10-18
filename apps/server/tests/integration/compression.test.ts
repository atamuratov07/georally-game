import type { Socket as NetSocket } from 'node:net'

import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { DEFAULT_GAME_CONFIG } from '@georally/game-domain/multiplayer'
import type { CreateRoomResponse } from '@georally/game-protocol'

import { bootstrapServer, type RoomClientSocket } from '../setup'

const TEXT_OPCODE = 1

interface ReceivedFrame {
	opcode: number
	compressed: boolean
	payloadLength: number
}

interface ClientWebSocket {
	_socket: NetSocket
	_extensions: Record<string, { params: Record<string, unknown> } | undefined>
}

interface WebSocketTransport {
	ws?: ClientWebSocket
}

function getWebSocket(client: RoomClientSocket) {
	const transport = client.io.engine.transport as unknown as WebSocketTransport
	if (!transport.ws) {
		throw new Error('The client is not on the WebSocket transport')
	}
	return transport.ws
}

function recordFrames(socket: NetSocket) {
	const frames: ReceivedFrame[] = []
	let buffered = Buffer.alloc(0)

	socket.on('data', (chunk: Buffer) => {
		buffered = Buffer.concat([buffered, chunk])
		while (buffered.length >= 2) {
			const lengthCode = buffered[1]! & 0x7f
			const headerLength =
				lengthCode === 126 ? 4 : lengthCode === 127 ? 10 : 2
			if (buffered.length < headerLength) {
				return
			}
			const payloadLength =
				lengthCode === 126
					? buffered.readUInt16BE(2)
					: lengthCode === 127
						? Number(buffered.readBigUInt64BE(2))
						: lengthCode
			if (buffered.length < headerLength + payloadLength) {
				return
			}
			frames.push({
				opcode: buffered[0]! & 0x0f,
				compressed: (buffered[0]! & 0x40) !== 0,
				payloadLength,
			})
			buffered = buffered.subarray(headerLength + payloadLength)
		}
	})

	return frames
}

async function playOpeningOfGame(env: NodeJS.ProcessEnv) {
	const server = await bootstrapServer(env)
	try {
		const response = await request(server.httpServer)
			.post('/api/rooms')
			.send({ hostName: 'Alice', roomMode: 'group' })
			.expect(201)
		const created: CreateRoomResponse = response.body.data

		const hostSocket = await server.connectClient({
			transports: ['websocket'],
		})
		const webSocket = getWebSocket(hostSocket)
		const frames = recordFrames(webSocket._socket)

		const resumed = await hostSocket.emitWithAck('room:host-resume', {
			memberSessionToken: created.memberSessionToken,
		})
		if (!resumed.ok) throw new Error('setup failed')

		const gameAnnounced = new Promise<void>(resolve => {
			hostSocket.on('room:update', update => {
				if (update.game) {
					resolve()
				}
			})
		})
		const started = await hostSocket.emitWithAck('game:start', {
			gameConfig: DEFAULT_GAME_CONFIG,
		})
		if (!started.ok) throw new Error('setup failed')
		await gameAnnounced

		return {
			deflateParams:
				webSocket._extensions['permessage-deflate']?.params ?? null,
			messages: frames.filter(frame => frame.opcode === TEXT_OPCODE),
		}
	} finally {
		await server.teardown()
	}
}

describe('permessage-deflate', () => {
	it('is not negotiated by default', async () => {
		const { deflateParams, messages } = await playOpeningOfGame({})

		expect(deflateParams).toBeNull()
		expect(messages.length).toBeGreaterThan(0)
		expect(messages.some(message => message.compressed)).toBe(false)
	})

	it('compresses only messages at or above the threshold', async () => {
		const { deflateParams, messages } = await playOpeningOfGame({
			SOCKET_PER_MESSAGE_DEFLATE: 'true',
			SOCKET_PER_MESSAGE_DEFLATE_THRESHOLD: '512',
		})

		expect(deflateParams).toMatchObject({ server_no_context_takeover: true })
		expect(messages.some(message => message.compressed)).toBe(true)
		const uncompressed = messages.filter(message => !message.compressed)
		expect(uncompressed.length).toBeGreaterThan(0)
		expect(uncompressed.every(message => message.payloadLength < 512)).toBe(
			true,
		)
	})

	it('compresses every message with context takeover at threshold 0', async () => {
		const { deflateParams, messages } = await playOpeningOfGame({
			SOCKET_PER_MESSAGE_DEFLATE: 'true',
			SOCKET_PER_MESSAGE_DEFLATE_THRESHOLD: '0',
		})

		expect(deflateParams).not.toBeNull()
		expect(deflateParams).not.toHaveProperty('server_no_context_takeover')
		expect(messages.length).toBeGreaterThan(0)
		expect(messages.every(message => message.compressed)).toBe(true)
	})
})
