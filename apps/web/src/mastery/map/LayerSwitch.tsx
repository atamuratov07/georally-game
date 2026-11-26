import { SKILL_IDS, type LayerId } from '@georally/mastery'
import { useTranslation } from 'react-i18next'
import { SegmentedControl } from '@/shared/ui'
import { SKILL_TONES } from '../shared/skillTones'

export function LayerSwitch({
	value,
	onChange,
}: {
	value: LayerId
	onChange: (layer: LayerId) => void
}) {
	const { t } = useTranslation()

	return (
		<SegmentedControl
			aria-label={t('review.layer')}
			value={value}
			options={[
				{ value: 'overall', label: t('review.overall'), tone: 'grape' },
				...SKILL_IDS.map(skill => ({
					value: skill,
					label: t(`review.skills.${skill}`),
					tone: SKILL_TONES[skill],
				})),
			]}
			onChange={onChange}
			size='sm'
			className='pointer-events-auto w-auto border-2 border-line bg-white shadow-[0_4px_0_0_var(--color-line)]'
		/>
	)
}
