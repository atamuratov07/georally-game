import { LoaderCircle } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useTransientMessage } from '@/shared/hooks/useTransientMessage'
import { FloatingNotice } from '@/shared/ui'

export function RoomNotices({
	isReconnecting,
	actionErrorMessage,
}: {
	isReconnecting: boolean
	actionErrorMessage: string | null
}) {
	const { t } = useTranslation()
	const errorMessage = useTransientMessage(actionErrorMessage)

	return (
		<AnimatePresence>
			{isReconnecting ? (
				<FloatingNotice
					key='reconnecting'
					icon={<LoaderCircle className='animate-spin' />}
				>
					{t('multiplayer.lobby.reconnecting')}
				</FloatingNotice>
			) : null}
			{errorMessage ? (
				<FloatingNotice
					key='error'
					tone='error'
					offset={isReconnecting ? 1 : 0}
				>
					{errorMessage}
				</FloatingNotice>
			) : null}
		</AnimatePresence>
	)
}
