import { PACES, setPace, type Pace } from '@georally/mastery'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingToggleGroup } from '@/shared/widgets/SettingToggleGroup'
import { mastery } from '../container'

const PACE_ORDER = Object.keys(PACES) as Pace[]

export function PaceSetting({
	pace,
	onSaved,
}: {
	pace: Pace
	onSaved: () => Promise<void>
}) {
	const { t } = useTranslation()
	const [chosen, setChosen] = useState<Pace | null>(null)

	async function choose(next: Pace) {
		setChosen(next)
		try {
			await setPace(mastery, next)
			await onSaved()
		} catch (error) {
			console.error(error)
		} finally {
			setChosen(current => (current === next ? null : current))
		}
	}

	return (
		<SettingToggleGroup
			label={t('review.pace')}
			value={chosen ?? pace}
			options={PACE_ORDER.map(value => ({
				value,
				label: t(`review.paces.${value}`),
			}))}
			onChange={next => void choose(next)}
		/>
	)
}
