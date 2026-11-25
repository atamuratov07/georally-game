import { describe, expect, it } from 'vitest'
import type { CardId, SkillId } from '../types'
import { decideBridge, type CasualOutcome } from './decideBridge'

const INTRODUCED: ReadonlySet<CardId> = new Set(['250:locate'])
const ACCEPTED: ReadonlySet<CardId> = new Set(['392:locate'])

const miss = (countryId: string, missed = true): CasualOutcome => ({
	countryId,
	skillId: 'locate',
	missed,
})

describe('decideBridge', () => {
	it.each<[string, CasualOutcome[], SkillId[], CardId[], CardId[]]>([
		[
			'ignores a round that is not a miss',
			[miss('417', false)],
			['locate'],
			[],
			[],
		],
		[
			'offers a missed unseen card',
			[miss('417')],
			['locate'],
			['417:locate'],
			[],
		],
		[
			'rechecks a missed card that has a record',
			[miss('250')],
			['locate'],
			[],
			['250:locate'],
		],
		[
			'ignores a miss on a paused skill',
			[miss('417'), miss('250')],
			[],
			[],
			[],
		],
		[
			'doesn’t offer a card already accepted',
			[miss('392')],
			['locate'],
			[],
			[],
		],
		[
			'counts a country missed twice once',
			[miss('417'), miss('417')],
			['locate'],
			['417:locate'],
			[],
		],
	])('%s', (_, outcomes, skills, offer, recheck) => {
		expect(decideBridge(outcomes, INTRODUCED, ACCEPTED, skills)).toEqual({
			offer,
			recheck,
		})
	})
})
