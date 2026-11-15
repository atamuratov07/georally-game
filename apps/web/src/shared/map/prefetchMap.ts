import { countryCatalog } from '@georally/country-catalog'
import {
	DEFAULT_LANGUAGE,
	normalizeAppLanguage,
	type AppLanguage,
} from '../i18n'
import archipelagosUrl from './generated/archipelagos.geojson?url'
import tileJson from './generated/tiles.json'
import {
	CAPITAL_LABEL_FONT,
	COUNTRY_LABEL_FONT,
	GLYPHS_URL,
} from './map-styles'

const PREFETCH_MAX_ZOOM = 2
const GLYPH_RANGE_SIZE = 256
const MIN_LABEL_SHARE = 0.05

let started = false

function warm(url: string): void {
	void fetch(url, { priority: 'low' }).catch(() => undefined)
}

function tileUrls(template: string): string[] {
	const urls: string[] = []
	for (let z = 0; z <= PREFETCH_MAX_ZOOM; z++) {
		const size = 2 ** z
		for (let x = 0; x < size; x++) {
			for (let y = 0; y < size; y++) {
				urls.push(
					template
						.replace('{z}', String(z))
						.replace('{x}', String(x))
						.replace('{y}', String(y)),
				)
			}
		}
	}
	return urls
}

function commonGlyphRanges(labels: readonly string[]): string[] {
	const labelCounts = new Map<string, number>()
	for (const label of labels) {
		const ranges = new Set<string>()
		for (const char of label) {
			const start =
				Math.floor((char.codePointAt(0) ?? 0) / GLYPH_RANGE_SIZE) *
				GLYPH_RANGE_SIZE
			ranges.add(`${start}-${start + GLYPH_RANGE_SIZE - 1}`)
		}
		for (const range of ranges) {
			labelCounts.set(range, (labelCounts.get(range) ?? 0) + 1)
		}
	}
	const minLabels = labels.length * MIN_LABEL_SHARE
	return [...labelCounts]
		.filter(([, count]) => count >= minLabels)
		.map(([range]) => range)
}

/** The glyph files most labels need; rare ranges still load on demand. */
function glyphUrls(language: AppLanguage): string[] {
	const countries = [...countryCatalog.countriesById.values()]
	const labels: Array<[font: string, texts: string[]]> = [
		[COUNTRY_LABEL_FONT, countries.map(country => country.name[language])],
		[CAPITAL_LABEL_FONT, countries.map(country => country.capital[language])],
	]
	return labels.flatMap(([font, texts]) =>
		commonGlyphRanges(texts).map(range =>
			GLYPHS_URL.replace('{fontstack}', font).replace('{range}', range),
		),
	)
}

export function prefetchMap(): void {
	if (started) {
		return
	}
	started = true

	const language =
		normalizeAppLanguage(document.documentElement.lang) ?? DEFAULT_LANGUAGE

	warm(archipelagosUrl)
	tileUrls(tileJson.tiles[0]).forEach(warm)
	glyphUrls(language).forEach(warm)
}
