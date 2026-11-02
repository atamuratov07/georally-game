import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PendingToastIcon } from '@/shared/ui/sonner'

const RECONNECTING_TOAST_ID = 'room-reconnecting'
const ACTION_ERROR_TOAST_ID = 'room-action-error'

export function RoomNotices({
	isReconnecting,
	actionErrorMessage,
}: {
	isReconnecting: boolean
	actionErrorMessage: string | null
}) {
	const { t } = useTranslation()

	useEffect(() => {
		if (!isReconnecting) return
		toast(t('multiplayer.lobby.reconnecting'), {
			id: RECONNECTING_TOAST_ID,
			duration: Infinity,
			icon: <PendingToastIcon />,
		})
		return () => {
			toast.dismiss(RECONNECTING_TOAST_ID)
		}
	}, [isReconnecting, t])

	useEffect(() => {
		if (!actionErrorMessage) return
		toast.error(actionErrorMessage, { id: ACTION_ERROR_TOAST_ID })
	}, [actionErrorMessage])

	return null
}
