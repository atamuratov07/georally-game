import { Flag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ConfirmButton } from '../../shared/components/ConfirmButton'

interface GiveUpButtonProps {
	onGiveUp: () => void
	confirmClassName: string
}

export function GiveUpButton({
	onGiveUp,
	confirmClassName,
}: GiveUpButtonProps) {
	const { t } = useTranslation()

	return (
		<ConfirmButton
			label={t('singleplayer.giveUp')}
			confirmLabel={t('routes.giveUpConfirm')}
			icon={<Flag aria-hidden='true' />}
			onConfirm={onGiveUp}
			confirmClassName={confirmClassName}
		/>
	)
}
