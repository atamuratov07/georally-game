import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { matchPath, Navigate, useLocation, useRoutes } from 'react-router-dom'
import type { AppLanguage } from '../shared/i18n/locales'
import { DEFAULT_LANGUAGE, normalizeAppLanguage } from '../shared/i18n/locales'
import { appRoutes } from './routes'
import {
	fromLocaleSegment,
	toLocaleSegment,
} from '../shared/i18n/locale-segment'
import { LocaleProvider } from './LocaleContext'

const KNOWN_PATTERNS = appRoutes.map(route => '/' + (route.path ?? ''))

export function LocaleGate() {
	const location = useLocation()
	const { i18n } = useTranslation()
	const segments = location.pathname.split('/').filter(Boolean)
	const [first, ...rest] = segments
	const localeFromUrl = fromLocaleSegment(first)

	if (localeFromUrl) {
		return (
			<LocalizedRoutes
				locale={localeFromUrl}
				rest={{
					pathname: '/' + rest.join('/'),
					search: location.search,
					hash: location.hash,
				}}
			/>
		)
	}

	const unprefixedPath = '/' + segments.join('/')
	const matchesRealRoute = KNOWN_PATTERNS.some(pattern =>
		matchPath({ path: pattern, end: true }, unprefixedPath),
	)
	const detected = normalizeAppLanguage(i18n.language) ?? DEFAULT_LANGUAGE
	const detectedSegment = toLocaleSegment(detected)

	const target = matchesRealRoute
		? `/${detectedSegment}${unprefixedPath === '/' ? '' : unprefixedPath}`
		: `/${detectedSegment}`

	return <Navigate to={target + location.search} replace />
}

function LocalizedRoutes({
	locale,
	rest,
}: {
	locale: AppLanguage
	rest: { pathname: string; search: string; hash: string }
}) {
	const { i18n } = useTranslation()
	const segment = toLocaleSegment(locale)

	useEffect(() => {
		if (i18n.language !== locale) {
			void i18n.changeLanguage(locale)
		}
	}, [locale, i18n])

	const routerElement = useRoutes(
		[
			...appRoutes,
			{ path: '*', element: <Navigate to={`/${segment}`} replace /> },
		],
		rest,
	)

	return <LocaleProvider value={locale}>{routerElement}</LocaleProvider>
}
