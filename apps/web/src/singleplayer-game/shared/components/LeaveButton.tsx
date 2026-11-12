import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/utils'
import { singleplayerPaths, type SingleplayerModeId } from '../../paths'

const TONES = {
	light: { variant: 'neutral', className: undefined },
	dark: {
		variant: 'ghost',
		className: 'text-white/70 hover:bg-white/10 hover:text-white',
	},
} as const

interface LeaveButtonProps {
	mode: SingleplayerModeId
	tone?: keyof typeof TONES
	className?: string
	onLeave?: () => void
}

export function LeaveButton({
	mode,
	tone = 'light',
	className,
	onLeave,
}: LeaveButtonProps) {
	const { t } = useTranslation()

	return (
		<Button
			asChild
			variant={TONES[tone].variant}
			size='icon'
			className={cn(TONES[tone].className, className)}
			aria-label={t('singleplayer.exit')}
			title={t('singleplayer.exit')}
		>
			<LocalizedLink to={singleplayerPaths(mode).setup} onClick={onLeave}>
				<LogOut aria-hidden='true' className='rotate-180' />
			</LocalizedLink>
		</Button>
	)
}
