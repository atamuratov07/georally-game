import type { GameDifficulty, GameScope } from '@georally/game-domain'
import type { TFunction } from 'i18next'
import { getDifficultyLabel, getScopeLabel } from '@/shared/i18n'
import type { SettingTone } from './SettingToggleGroup'
import type { SettingOption } from './SettingToggleGroup'

const DIFFICULTY_TONES: Record<GameDifficulty, SettingTone> = {
	easy: 'grass',
	medium: 'sunflower',
	hard: 'coral',
}

export function numberOptions(
	values: readonly number[],
): SettingOption<number>[] {
	return values.map(value => ({ value, label: value }))
}

export function scopeOptions(
	t: TFunction,
	scopes: readonly { value: GameScope }[],
): SettingOption<GameScope>[] {
	return scopes.map(({ value }) => ({
		value,
		label: getScopeLabel(t, value),
	}))
}

export function difficultyOptions(
	t: TFunction,
	difficulties: readonly { value: GameDifficulty }[],
): SettingOption<GameDifficulty>[] {
	return difficulties.map(({ value }) => ({
		value,
		label: getDifficultyLabel(t, value),
		tone: DIFFICULTY_TONES[value],
	}))
}
