import {
	SKILL_IDS,
	type LearnerSettings,
	type Pace,
	type SkillId,
} from './types'

export const PACES: Readonly<
	Record<Pace, { newPerDay: number; reviewCap: number }>
> = {
	relaxed: { newPerDay: 5, reviewCap: 30 },
	steady: { newPerDay: 8, reviewCap: 60 },
	intense: { newPerDay: 12, reviewCap: 80 },
}

export const DEFAULT_SETTINGS: LearnerSettings = {
	pace: 'steady',
	pausedSkills: [],
}

export function activeSkills(settings: LearnerSettings): SkillId[] {
	return SKILL_IDS.filter(skill => !settings.pausedSkills.includes(skill))
}

export function withSkill(
	settings: LearnerSettings,
	skill: SkillId,
	active: boolean,
): LearnerSettings {
	const pausedSkills = SKILL_IDS.filter(
		id => id !== skill && settings.pausedSkills.includes(id),
	)
	if (!active) pausedSkills.push(skill)
	return pausedSkills.length < SKILL_IDS.length
		? { ...settings, pausedSkills }
		: settings
}
