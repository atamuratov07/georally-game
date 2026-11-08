import type { AppLanguage } from '../i18n/locales'

export const SPEECH_LANGUAGES = ['en-US', 'ru-RU'] as const

const UI_SPEECH_LANGUAGE: Record<AppLanguage, string | null> = {
	en: 'en-US',
	ru: 'ru-RU',
	'uz-Latn': null,
}

export function defaultSpeechLanguage(locale: AppLanguage): string | null {
	return UI_SPEECH_LANGUAGE[locale]
}
