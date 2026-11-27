import { Download, MessageSquareText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFeedback } from '@/shared/feedback'
import { LanguageOptions } from '@/shared/i18n'
import { useInstallApp } from '@/shared/pwa'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/shared/ui'
import { cn } from '@/shared/utils'
const BAR =
	'absolute left-0 h-[3px] w-full rounded-full bg-current transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]'

export function HeaderMenu({ className }: { className?: string }) {
	const { t } = useTranslation()
	const openFeedback = useFeedback()
	const { available, install, help } = useInstallApp()

	return (
		<>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger
					aria-label={t('app.menu')}
					className={cn(
						'group inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-on-sky/10 data-[state=open]:bg-on-sky/10',
						className,
					)}
				>
					<span
						aria-hidden='true'
						className='relative h-4.5 w-5.5 text-white drop-shadow-[0_1.5px_0_var(--color-ink)]'
					>
						<span
							className={cn(
								BAR,
								'top-0 group-data-[state=open]:translate-y-[7.5px] group-data-[state=open]:rotate-45',
							)}
						/>
						<span
							className={cn(
								BAR,
								'top-[7.5px] group-data-[state=open]:scale-x-0 group-data-[state=open]:opacity-0',
							)}
						/>
						<span
							className={cn(
								BAR,
								'top-[15px] group-data-[state=open]:-translate-y-[7.5px] group-data-[state=open]:-rotate-45',
							)}
						/>
					</span>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end'>
					{available ? (
						<DropdownMenuItem onSelect={install}>
							<Download aria-hidden='true' strokeWidth={2.5} />
							{t('pwa.install')}
						</DropdownMenuItem>
					) : null}
					<DropdownMenuItem onSelect={() => openFeedback()}>
						<MessageSquareText aria-hidden='true' strokeWidth={2.5} />
						{t('feedback.open')}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<LanguageOptions />
				</DropdownMenuContent>
			</DropdownMenu>
			{help}
		</>
	)
}
