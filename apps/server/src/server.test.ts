import { describe, expect, it } from 'vitest'

import { toPerMessageDeflateOptions } from './server.js'

describe('toPerMessageDeflateOptions', () => {
	it('turns compression off when disabled', () => {
		expect(
			toPerMessageDeflateOptions({ enabled: false, threshold: 1_024 }),
		).toBe(false)
	})

	it('disables context takeover so the threshold applies', () => {
		expect(
			toPerMessageDeflateOptions({ enabled: true, threshold: 1_024 }),
		).toEqual({ threshold: 1_024, serverNoContextTakeover: true })
	})

	it('keeps context takeover when every message is compressed', () => {
		expect(
			toPerMessageDeflateOptions({ enabled: true, threshold: 0 }),
		).toEqual({ threshold: 0, serverNoContextTakeover: false })
	})
})
