import { DoorClosed } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { StatusScreen } from '@/shared/layout'
import { Button, TextButton } from '@/shared/ui'
import { formatClosedReason } from '../model/roomSelectors'

interface RoomClosedScreenProps {
	reason: 'host_terminated' | 'expired' | 'server_shutdown'
}

export function RoomClosedScreen({ reason }: RoomClosedScreenProps) {
	const { t } = useTranslation()

	return (
		<StatusScreen
			tone='neutral'
			icon={<DoorClosed />}
			title={formatClosedReason(reason)}
			actions={
				<>
					<TextButton asChild>
						<LocalizedLink to='/'>{t('common.home')}</LocalizedLink>
					</TextButton>
					<Button asChild variant='grape'>
						<LocalizedLink to='/multiplayer'>
							{t('multiplayer.finished.joinAnother')}
						</LocalizedLink>
					</Button>
				</>
			}
		/>
	)
}
