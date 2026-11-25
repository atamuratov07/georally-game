import { useLocation } from 'react-router-dom'
import { useCurrentLocale } from '@/app/LocaleContext'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/shared/ui'
import { fromLocaleSegment } from './locale-segment'
import { APP_LANGUAGE_OPTIONS, isAppLanguage } from './locales'

export function LanguageOptions() {
	const language = useCurrentLocale()
	const navigate = useLocalizedNavigate()
	const location = useLocation()

	const handleChange = (next: string) => {
		if (!isAppLanguage(next) || next === language) return

		const segments = location.pathname.split('/').filter(Boolean)
		const rest = fromLocaleSegment(segments[0]) ? segments.slice(1) : segments
		navigate('/' + rest.join('/') + location.search, {
			locale: next,
			replace: true,
		})
	}

	return (
		<DropdownMenuRadioGroup value={language} onValueChange={handleChange}>
			{APP_LANGUAGE_OPTIONS.map(option => (
				<DropdownMenuRadioItem
					key={option.value}
					value={option.value}
					lang={option.value}
				>
					{option.label}
				</DropdownMenuRadioItem>
			))}
		</DropdownMenuRadioGroup>
	)
}
