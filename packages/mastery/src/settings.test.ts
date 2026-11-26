import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, withSkill } from './settings'

describe('withSkill', () => {
	it('pauses and resumes a skill, but never the last active one', () => {
		const paused = withSkill(DEFAULT_SETTINGS, 'name', false)
		expect(paused.pausedSkills).toEqual(['name'])
		expect(withSkill(paused, 'locate', false)).toBe(paused)
		expect(withSkill(paused, 'name', true).pausedSkills).toEqual([])
	})
})
