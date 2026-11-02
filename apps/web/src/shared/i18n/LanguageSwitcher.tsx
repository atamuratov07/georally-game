import { ChevronDown, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useCurrentLocale } from '@/app/LocaleContext'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from '@/shared/ui'
import { cn } from '@/shared/utils'
import { fromLocaleSegment } from './locale-segment'
import { APP_LANGUAGE_OPTIONS, isAppLanguage } from './locales'

export function LanguageSwitcher({ className }: { className?: string }) {
	const { t } = useTranslation()
	const language = useCurrentLocale()
	const navigate = useLocalizedNavigate()
	const location = useLocation()
	const current = APP_LANGUAGE_OPTIONS.find(
		option => option.value === language,
	)

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
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger
				aria-label={t('app.language')}
				className={cn(
					'group inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-extrabold text-ink transition-colors hover:bg-ink/6 data-[state=open]:bg-ink/6',
					className,
				)}
			>
				<Languages
					aria-hidden='true'
					className='size-5'
					strokeWidth={2.5}
				/>
				{current?.shortLabel}
				<ChevronDown
					aria-hidden='true'
					className='size-4 text-muted transition-transform group-data-[state=open]:rotate-180'
					strokeWidth={3}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<DropdownMenuRadioGroup
					value={language}
					onValueChange={handleChange}
				>
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
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
