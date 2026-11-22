import type {
	GameContinent,
	GameDifficulty,
	GameRegions,
} from '@georally/game-domain'
import i18next, { type TFunction } from 'i18next'

export function getDifficultyLabel(
	t: TFunction,
	difficulty: GameDifficulty,
): string {
	return t(`game.difficulty.${difficulty}`)
}

export function getRegionLabel(
	t: TFunction,
	region: GameContinent | 'all',
): string {
	return t(`game.scope.${region}`)
}

export function joinRegionLabels(labels: readonly string[]): string {
	return new Intl.ListFormat(i18next.language, {
		style: 'long',
		type: 'conjunction',
	}).format(labels)
}

export function getRegionsLabel(t: TFunction, regions: GameRegions): string {
	return regions.length === 0
		? getRegionLabel(t, 'all')
		: joinRegionLabels(regions.map(region => getRegionLabel(t, region)))
}
