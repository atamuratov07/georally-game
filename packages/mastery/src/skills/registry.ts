import type { SkillId } from '../types'
import type { Grader } from './grade'
import { gradeLocate } from './locate'
import { gradeName } from './name'

export interface SkillDefinition {
	id: SkillId
	grade: Grader
}

export const SKILLS: Readonly<Record<SkillId, SkillDefinition>> = {
	locate: { id: 'locate', grade: gradeLocate },
	name: { id: 'name', grade: gradeName },
}
