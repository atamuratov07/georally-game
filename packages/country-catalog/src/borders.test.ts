import { describe, expect, it } from 'vitest'
import { borderGraph } from './borders'
import { countryCatalog } from './catalog'

const ID = {
	ALB: '008',
	AZE: '031',
	BRA: '076',
	BWA: '072',
	DJI: '262',
	ESP: '724',
	FRA: '250',
	ITA: '380',
	MAR: '504',
	MRT: '478',
	MYS: '458',
	POL: '616',
	RUS: '643',
	SGP: '702',
	SOM: '706',
	SRB: '688',
	TUR: '792',
	VAT: '336',
	ZMB: '894',
} as const

const borders = (a: string, b: string) =>
	(borderGraph[a] ?? []).includes(b) && (borderGraph[b] ?? []).includes(a)

describe('border graph', () => {
	it('joins distinct playable countries, once each, both ways', () => {
		for (const [id, neighbours] of Object.entries(borderGraph)) {
			expect(countryCatalog.countriesById.has(id)).toBe(true)
			expect(new Set(neighbours).size).toBe(neighbours.length)
			for (const other of neighbours) {
				expect(other).not.toBe(id)
				expect(borderGraph[other]).toContain(id)
			}
		}
	})

	it.each([
		['FRA', 'BRA', true],
		['RUS', 'POL', true],
		['AZE', 'TUR', true],
		['ESP', 'MAR', true],
		['ZMB', 'BWA', true],
		['ITA', 'VAT', true],
		['MYS', 'SGP', false],
		['SRB', 'ALB', false],
		['SOM', 'DJI', false],
		['MAR', 'MRT', false],
	] as const)('%s-%s is a border: %s', (a, b, expected) => {
		expect(borders(ID[a], ID[b])).toBe(expected)
	})
})
