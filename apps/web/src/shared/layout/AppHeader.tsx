import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { ReviewLink } from '@/app/ReviewLink'
import logo from '@/assets/logo.png'
import { FeedbackButton } from '@/shared/feedback'
import { LanguageSwitcher } from '@/shared/i18n'
import { InstallAppButton } from '@/shared/pwa'
import { cn } from '@/shared/utils'
import { outlinedText } from '@/shared/widgets/outlinedText'
import { HeaderMenu } from './HeaderMenu'

const NAME_TEXT = outlinedText(0.16, 0.12, 'em')

export function AppLogo({
	title,
	emblem,
	className,
}: {
	title?: string
	emblem?: ReactNode
	className?: string
}) {
	const { t } = useTranslation()

	return (
		<LocalizedLink
			to='/'
			aria-label={title ? t('app.name') : undefined}
			className={cn(
				'inline-flex shrink-0 items-center gap-2 rounded-control text-xl font-black tracking-tight sm:text-2xl',
				className,
			)}
		>
			{emblem ?? (
				<img
					src={logo}
					alt=''
					width={45}
					height={41}
					className='h-[41px] w-[45px]'
				/>
			)}
			<span
				className='-m-[0.2em] truncate p-[0.2em] text-white'
				style={NAME_TEXT}
			>
				{title ?? t('app.name')}
			</span>
		</LocalizedLink>
	)
}

export function AppHeader({
	title,
	emblem,
	children,
	className,
}: {
	title?: string
	emblem?: ReactNode
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
			<AppLogo title={title} emblem={emblem} className='min-w-0 shrink' />
			<div className='flex shrink-0 items-center gap-1 sm:gap-2'>
				{children}
				<ReviewLink />
				<div className='flex items-center gap-2 max-sm:hidden'>
					<InstallAppButton />
					<FeedbackButton />
					<LanguageSwitcher />
				</div>
				<HeaderMenu className='sm:hidden' />
			</div>
		</header>
	)
}
