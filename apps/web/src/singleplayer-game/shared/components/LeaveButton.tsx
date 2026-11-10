import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { Button } from '@/shared/ui'
import { singleplayerPaths, type SingleplayerModeId } from '../../paths'

interface LeaveButtonProps {
	mode: SingleplayerModeId
	className?: string
	onLeave?: () => void
}

export function LeaveButton({ mode, className, onLeave }: LeaveButtonProps) {
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
			<LocalizedLink to={singleplayerPaths(mode).setup} onClick={onLeave}>
				<LogOut aria-hidden='true' className='rotate-180' />
			</LocalizedLink>
		</Button>
	)
}
