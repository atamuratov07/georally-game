import { PACES, type Pace } from '@georally/mastery'
import { useTranslation } from 'react-i18next'
import { SettingToggleGroup } from '@/shared/widgets/SettingToggleGroup'

const PACE_ORDER = Object.keys(PACES) as Pace[]

export function PaceSetting({
	pace,
	onChange,
}: {
	pace: Pace
	onChange: (pace: Pace) => void
}) {
	const { t } = useTranslation()
	return (
		<SettingToggleGroup
			label={t('review.pace')}
			value={pace}
			options={PACE_ORDER.map(value => ({
				value,
				label: t(`review.paces.${value}`),
			}))}
			onChange={onChange}
		/>
	)
}
