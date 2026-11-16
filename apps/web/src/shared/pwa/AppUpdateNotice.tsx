import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/shared/ui'
import { applyUpdate, useUpdateReady } from './serviceWorker'

const TOAST_ID = 'app-update'

export function AppUpdateNotice() {
	const { t } = useTranslation()
	const updateReady = useUpdateReady()

	useEffect(() => {
		if (!updateReady) return
		toast(t('pwa.updateReady'), {
			id: TOAST_ID,
			duration: Infinity,
			action: (
				<Button size='sm' onClick={applyUpdate}>
					{t('pwa.updateNow')}
				</Button>
			),
		})
		return () => {
			toast.dismiss(TOAST_ID)
		}
	}, [updateReady, t])

	return null
}
