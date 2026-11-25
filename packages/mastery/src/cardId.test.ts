import { describe, expect, it } from 'vitest'
import { parseCardId, toCardId } from './cardId'

describe('parseCardId', () => {
	it('reads back what toCardId builds', () => {
		expect(parseCardId(toCardId('417', 'locate'))).toEqual({
			countryId: '417',
			skillId: 'locate',
		})
	})

	it.each(['417', '417:capital', ':locate', '417:locate:x'])(
		'rejects %s',
		cardId => {
			expect(parseCardId(cardId)).toBeNull()
		},
	)
})
