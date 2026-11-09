import type { AppLanguage } from '../i18n/locales'

const UI_SPEECH_LANGUAGE: Record<AppLanguage, string | null> = {
	en: 'en-US',
	ru: 'ru-RU',
	'uz-Latn': 'uz-UZ',
}

export function defaultSpeechLanguage(locale: AppLanguage): string | null {
	return UI_SPEECH_LANGUAGE[locale]
}
