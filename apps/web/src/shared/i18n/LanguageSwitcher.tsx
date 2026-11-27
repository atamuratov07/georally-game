import { ChevronDown, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from '@/app/LocaleContext'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/shared/ui'
import { cn } from '@/shared/utils'
import { LanguageOptions } from './LanguageOptions'
import { APP_LANGUAGE_OPTIONS } from './locales'

export function LanguageSwitcher({ className }: { className?: string }) {
	const { t } = useTranslation()
	const language = useCurrentLocale()
	const current = APP_LANGUAGE_OPTIONS.find(
		option => option.value === language,
	)

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger
				aria-label={t('app.language')}
				className={cn(
					'group inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-extrabold text-on-sky transition-colors hover:bg-on-sky/10 data-[state=open]:bg-on-sky/10',
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
					className='size-4 text-on-sky-soft transition-transform group-data-[state=open]:rotate-180'
					strokeWidth={3}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<LanguageOptions />
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
