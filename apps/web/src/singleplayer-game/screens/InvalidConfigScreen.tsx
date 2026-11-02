import { SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { StatusScreen } from '@/shared/layout'
import { Button } from '@/shared/ui'

export function InvalidConfigScreen() {
	const { t } = useTranslation()

	return (
		<StatusScreen
			tone='sunflower'
			icon={<SlidersHorizontal />}
			title={t('singleplayer.invalidTitle')}
			description={t('singleplayer.invalidDescription')}
			actions={
				<Button asChild variant='ocean'>
					<LocalizedLink to='/singleplayer'>
						{t('singleplayer.openSettings')}
					</LocalizedLink>
				</Button>
			}
		/>
	)
}
