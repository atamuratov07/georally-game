import type { LanguageRules } from './types'

const UZBEK_CYRILLIC_TO_LATIN = new Map([
	['а', 'a'],
	['б', 'b'],
	['в', 'v'],
	['г', 'g'],
	['ғ', "g'"],
	['д', 'd'],
	['е', 'e'],
	['ё', 'yo'],
	['ж', 'j'],
	['з', 'z'],
	['и', 'i'],
	['й', 'y'],
	['к', 'k'],
	['қ', 'q'],
	['л', 'l'],
	['м', 'm'],
	['н', 'n'],
	['о', 'o'],
	['п', 'p'],
	['р', 'r'],
	['с', 's'],
	['т', 't'],
	['у', 'u'],
	['ў', "o'"],
	['ф', 'f'],
	['х', 'x'],
	['ҳ', 'h'],
	['ц', 's'],
	['ч', 'ch'],
	['ш', 'sh'],
	['щ', 'sh'],
	['ъ', "'"],
	['ы', 'i'],
	['ь', ''],
	['э', 'e'],
	['ю', 'yu'],
	['я', 'ya'],
])

export function foldUzbekCyrillic(raw: string): string {
	let output = ''

	for (const char of raw) {
		output += UZBEK_CYRILLIC_TO_LATIN.get(char.toLowerCase()) ?? char
	}

	return output
}

export const uzbekRules: LanguageRules = {
	dropLeadingWords: [],
	rewriteWords: {},
	foldInput: foldUzbekCyrillic,
}
