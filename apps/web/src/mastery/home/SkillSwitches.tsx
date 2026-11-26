import {
	activeSkills,
	setSkillActive,
	SKILL_IDS,
	type LearnerSettings,
	type SkillId,
} from '@georally/mastery'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Switch } from '@/shared/ui'
import { mastery } from '../container'
import { SKILL_TONES } from '../shared/skillTones'

export function SkillSwitches({
	settings,
	onSaved,
}: {
	settings: LearnerSettings
	onSaved: () => Promise<void>
}) {
	const { t } = useTranslation()
	const labelId = useId()
	const [chosen, setChosen] = useState<SkillId[] | null>(null)
	const active = chosen ?? activeSkills(settings)

	async function toggle(skill: SkillId, on: boolean) {
		const next = SKILL_IDS.filter(id =>
			id === skill ? on : active.includes(id),
		)
		setChosen(next)
		try {
			await setSkillActive(mastery, skill, on)
			await onSaved()
		} catch (error) {
			console.error(error)
		} finally {
			setChosen(current => (current === next ? null : current))
		}
	}

	return (
		<div
			role='group'
			aria-labelledby={labelId}
			className='flex flex-col gap-2'
		>
			<span id={labelId} className='text-sm font-extrabold text-muted'>
				{t('review.skillsLabel')}
			</span>
			<div className='flex flex-wrap items-center gap-x-7 gap-y-3'>
				{SKILL_IDS.map(skill => {
					const on = active.includes(skill)
					return (
						<Switch
							key={skill}
							checked={on}
							tone={SKILL_TONES[skill]}
							// Review needs something to ask, so the last skill stays on.
							locked={on && active.length === 1}
							onCheckedChange={next => void toggle(skill, next)}
						>
							{t(`review.skills.${skill}`)}
						</Switch>
					)
				})}
			</div>
		</div>
	)
}
