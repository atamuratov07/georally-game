import type { GameDifficulty } from '@georally/game-domain'
import type { TFunction } from 'i18next'
import { getDifficultyLabel } from '@/shared/i18n'
import type { ControlTone, SegmentOption } from '@/shared/ui'

export const LEVEL_TONES = ['grass', 'sunflower', 'coral'] as const

const DIFFICULTY_TONES: Record<GameDifficulty, ControlTone> = {
	easy: LEVEL_TONES[0],
	medium: LEVEL_TONES[1],
	hard: LEVEL_TONES[2],
}

export function numberOptions(
	values: readonly number[],
): SegmentOption<number>[] {
	return values.map(value => ({ value, label: value }))
}

export function difficultyOptions(
	t: TFunction,
	difficulties: readonly { value: GameDifficulty }[],
): SegmentOption<GameDifficulty>[] {
	return difficulties.map(({ value }) => ({
		value,
		label: getDifficultyLabel(t, value),
		tone: DIFFICULTY_TONES[value],
	}))
}
