import { ArrowRight, Flag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/utils'

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
	pending,
	onNext,
}: {
	size: 'inline' | 'main'
	pending?: boolean
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
			pending={pending}
			onClick={onNext}
		>
			<ArrowRight
				aria-hidden='true'
				className={size === 'main' ? 'size-9' : 'size-7'}
			/>
		</Button>
	)
}
