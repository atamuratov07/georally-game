import { ArrowRight, Flag, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/utils'
import { singleplayerPaths } from '../../paths'

export function LeaveButton({ className }: { className?: string }) {
	const { t } = useTranslation()

	return (
		<Button
			asChild
			variant='neutral'
			size='icon'
			className={className}
			aria-label={t('singleplayer.exit')}
			title={t('singleplayer.exit')}
		>
			<LocalizedLink to={singleplayerPaths('name-it').setup}>
				<LogOut aria-hidden='true' className='rotate-180' />
			</LocalizedLink>
		</Button>
	)
}

export function GiveUpButton({
	onGiveUp,
	className,
}: {
	onGiveUp: () => void
	className?: string
}) {
	const { t } = useTranslation()

	return (
		<Button
			type='button'
			variant='neutral'
			size='icon'
			className={className}
			aria-label={t('singleplayer.giveUp')}
			title={t('singleplayer.giveUp')}
			onClick={onGiveUp}
		>
			<Flag aria-hidden='true' />
		</Button>
	)
}

export function NextButton({
	size,
	onNext,
}: {
	size: 'inline' | 'main'
	onNext: () => void
}) {
	const { t } = useTranslation()

	return (
		<Button
			type='button'
			size='icon'
			variant='ocean'
			className={cn(
				'animate-pop-in [&_svg]:stroke-[3.25]',
				size === 'main' ? 'size-16' : 'size-12',
			)}
			aria-label={t('singleplayer.next')}
			title={t('singleplayer.next')}
			onClick={onNext}
		>
			<ArrowRight
				aria-hidden='true'
				className={size === 'main' ? 'size-9' : 'size-7'}
			/>
		</Button>
	)
}

interface ProgressProps {
	current: number
	total: number
}

export function ProgressChip({
	current,
	total,
	className,
}: ProgressProps & { className?: string }) {
	const { t } = useTranslation()

	return (
		<span
			className={cn(
				'raised grid h-11 min-w-11 place-items-center rounded-full border-2 border-line-strong bg-white px-3.5 text-base font-black text-ink tabular-nums [--edge-size:4px] [--edge:var(--color-line-strong)]',
				className,
			)}
			aria-label={t('game.progress', { current, total })}
		>
			{current}/{total}
		</span>
	)
}

export function ProgressText({ current, total }: ProgressProps) {
	const { t } = useTranslation()

	return (
		<span
			className='px-2 text-sm font-black text-muted tabular-nums'
			aria-label={t('game.progress', { current, total })}
		>
			{current}/{total}
		</span>
	)
}
