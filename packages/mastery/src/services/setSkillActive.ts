import type { MasteryDeps } from '../ports'
import { withSkill } from '../settings'
import type { SkillId } from '../types'

export async function setSkillActive(
	{ repository }: MasteryDeps,
	skill: SkillId,
	active: boolean,
) {
	const { settings } = await repository.loadMeta()
	await repository.saveSettings(withSkill(settings, skill, active))
}
