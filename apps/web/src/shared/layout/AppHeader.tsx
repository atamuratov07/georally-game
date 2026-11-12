import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import logo from '@/assets/logo.png'
import { FeedbackButton } from '@/shared/feedback'
import { LanguageSwitcher } from '@/shared/i18n'
import { cn } from '@/shared/utils'

export function AppLogo({ className }: { className?: string }) {
	const { t } = useTranslation()

	return (
		<LocalizedLink
			to='/'
			className={cn(
				'inline-flex items-center gap-2 rounded-control text-2xl font-black tracking-tight',
				className,
			)}
		>
			<img src={logo} alt='' className='size-10' />
			{t('app.name')}
		</LocalizedLink>
	)
}

export function AppHeader({
	children,
	className,
}: {
	children?: ReactNode
	className?: string
}) {
	return (
		<header
			className={cn(
				'mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6',
				className,
			)}
		>
			<AppLogo />
			<div className='flex items-center gap-1 sm:gap-2'>
				{children}
				<FeedbackButton />
				<LanguageSwitcher />
			</div>
		</header>
	)
}
