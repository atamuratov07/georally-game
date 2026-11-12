import { describe, expect, it } from 'vitest'

import { parseEnv } from './env.js'

describe('parseEnv', () => {
	it('logs stats every 60 seconds by default', () => {
		expect(parseEnv({}).statsIntervalMs).toBe(60_000)
	})

	it('reads the stats interval from STATS_INTERVAL_MS', () => {
		expect(parseEnv({ STATS_INTERVAL_MS: '1000' }).statsIntervalMs).toBe(
			1_000,
		)
	})

	it('rejects a stats interval below one second', () => {
		expect(() => parseEnv({ STATS_INTERVAL_MS: '999' })).toThrow()
	})

	it('leaves permessage-deflate off with a 1024-byte threshold by default', () => {
		const env = parseEnv({})

		expect(env.perMessageDeflate).toBe(false)
		expect(env.perMessageDeflateThreshold).toBe(1_024)
	})

	it('reads permessage-deflate settings from the environment', () => {
		const env = parseEnv({
			SOCKET_PER_MESSAGE_DEFLATE: 'true',
			SOCKET_PER_MESSAGE_DEFLATE_THRESHOLD: '512',
		})

		expect(env.perMessageDeflate).toBe(true)
		expect(env.perMessageDeflateThreshold).toBe(512)
	})

	it('reads false as permessage-deflate off', () => {
		expect(
			parseEnv({ SOCKET_PER_MESSAGE_DEFLATE: 'false' }).perMessageDeflate,
		).toBe(false)
	})

	it('rejects an unknown permessage-deflate value', () => {
		expect(() => parseEnv({ SOCKET_PER_MESSAGE_DEFLATE: 'maybe' })).toThrow()
	})

	it('disables feedback when the Telegram variables are empty', () => {
		expect(
			parseEnv({ TELEGRAM_BOT_TOKEN: '', TELEGRAM_FEEDBACK_CHAT_ID: '' })
				.feedbackTelegram,
		).toBeNull()
	})

	it('reads the Telegram feedback target', () => {
		expect(
			parseEnv({
				TELEGRAM_BOT_TOKEN: '123:abc',
				TELEGRAM_FEEDBACK_CHAT_ID: '-1001234567890',
			}).feedbackTelegram,
		).toEqual({ botToken: '123:abc', chatId: '-1001234567890' })
	})

	it('rejects a Telegram token without a chat id', () => {
		expect(() => parseEnv({ TELEGRAM_BOT_TOKEN: '123:abc' })).toThrow()
	})

	it('rejects a negative permessage-deflate threshold', () => {
		expect(() =>
			parseEnv({ SOCKET_PER_MESSAGE_DEFLATE_THRESHOLD: '-1' }),
		).toThrow()
	})
})
