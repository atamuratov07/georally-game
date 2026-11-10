import type { AppLanguage } from '@/shared/i18n/locales'

const NAMES: Record<string, Record<AppLanguage, string>> = {
	'380': { en: 'Italy', ru: 'Италия', 'uz-Latn': 'Italiya' },
	'392': { en: 'Japan', ru: 'Япония', 'uz-Latn': 'Yaponiya' },
	'036': { en: 'Australia', ru: 'Австралия', 'uz-Latn': 'Avstraliya' },
	'076': { en: 'Brazil', ru: 'Бразилия', 'uz-Latn': 'Braziliya' },
	'356': { en: 'India', ru: 'Индия', 'uz-Latn': 'Hindiston' },
	'826': {
		en: 'United Kingdom',
		ru: 'Великобритания',
		'uz-Latn': 'Birlashgan Qirollik',
	},
	'250': { en: 'France', ru: 'Франция', 'uz-Latn': 'Fransiya' },
	'724': { en: 'Spain', ru: 'Испания', 'uz-Latn': 'Ispaniya' },
	'300': { en: 'Greece', ru: 'Греция', 'uz-Latn': 'Yunoniston' },
	'276': { en: 'Germany', ru: 'Германия', 'uz-Latn': 'Germaniya' },
	'616': { en: 'Poland', ru: 'Польша', 'uz-Latn': 'Polsha' },
	'752': { en: 'Sweden', ru: 'Швеция', 'uz-Latn': 'Shvetsiya' },
	'578': { en: 'Norway', ru: 'Норвегия', 'uz-Latn': 'Norvegiya' },
	'246': { en: 'Finland', ru: 'Финляндия', 'uz-Latn': 'Finlandiya' },
	'804': { en: 'Ukraine', ru: 'Украина', 'uz-Latn': 'Ukraina' },
}

export function demoName(countryId: string, language: AppLanguage): string {
	return NAMES[countryId]?.[language] ?? ''
}
