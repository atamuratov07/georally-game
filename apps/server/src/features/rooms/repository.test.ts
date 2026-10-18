import { describe, expect, it } from 'vitest'

import { RoomsRepository } from './repository.js'

describe('RoomsRepository.createMemberSession', () => {
	it('does not put the session token into the duplicate session error', () => {
		const repository = new RoomsRepository()
		const session = {
			token: 'secret-token',
			roomId: 'room-1',
			memberId: 'member-1',
			role: 'player' as const,
		}
		repository.createMemberSession(session)

		expect(() => repository.createMemberSession({ ...session })).toThrow(
			expect.objectContaining({
				message: expect.not.stringContaining('secret-token'),
			}),
		)
	})
})
