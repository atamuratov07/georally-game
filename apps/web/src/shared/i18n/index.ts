export { I18nDocumentSync } from './I18nDocumentSync.tsx'
export { LanguageOptions } from './LanguageOptions'
export { LanguageSwitcher } from './LanguageSwitcher'
export {
	APP_LANGUAGE_OPTIONS,
	APP_LANGUAGES,
	DEFAULT_LANGUAGE,
	LANGUAGE_STORAGE_KEY,
	type AppLanguage,
	normalizeAppLanguage,
	resolveAppLanguage,
	toFormattingLocale,
} from './locales'
export {
	getCountryCapital,
	getCountryCurrency,
	getCountryName,
} from './countryText'
export {
	getDifficultyLabel,
	getRegionLabel,
	getRegionsLabel,
	joinRegionLabels,
} from './gameLabels'
export { useAppLanguage } from './useAppLanguage'
