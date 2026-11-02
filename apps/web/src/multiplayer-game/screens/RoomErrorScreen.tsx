import { Unplug } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { StatusScreen } from '@/shared/layout'
import { Button, TextButton } from '@/shared/ui'

interface RoomErrorScreenProps {
	message: string
	onRetry: () => void
}

export function RoomErrorScreen({ message, onRetry }: RoomErrorScreenProps) {
	const { t } = useTranslation()

	return (
		<StatusScreen
			tone='coral'
			icon={<Unplug />}
			title={message}
			actions={
				<>
					<TextButton asChild>
						<LocalizedLink to='/multiplayer'>
							{t('multiplayer.title')}
						</LocalizedLink>
					</TextButton>
					<Button type='button' onClick={onRetry}>
						{t('common.retry')}
					</Button>
				</>
			}
		/>
	)
}
