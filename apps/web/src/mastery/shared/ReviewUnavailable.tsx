import { DatabaseZap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { StatusScreen } from '@/shared/layout'
import { Button } from '@/shared/ui'

export function ReviewUnavailable() {
	const { t } = useTranslation()
	return (
		<StatusScreen
			title={t('review.unavailable')}
			icon={<DatabaseZap />}
			tone='coral'
			actions={
				<Button asChild variant='neutral'>
					<LocalizedLink to='/'>{t('common.home')}</LocalizedLink>
				</Button>
			}
		/>
	)
}
