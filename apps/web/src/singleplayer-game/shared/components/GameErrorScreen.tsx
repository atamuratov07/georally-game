import { MapPinOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { StatusScreen } from '@/shared/layout'
import { Button } from '@/shared/ui'

export function GameErrorScreen({ setupPath }: { setupPath: string }) {
	const { t } = useTranslation()

	return (
		<StatusScreen
			tone='coral'
			icon={<MapPinOff />}
			title={t('singleplayer.gameError.title')}
			actions={
				<Button asChild variant='ocean'>
					<LocalizedLink to={setupPath}>
						{t('singleplayer.gameError.action')}
					</LocalizedLink>
				</Button>
			}
		/>
	)
}
