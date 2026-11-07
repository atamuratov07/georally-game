import type { GameContinent } from '@georally/game-domain'

export interface ContinentViewPreset {
	focusBounds: [[number, number], [number, number]]
	maxBounds: [number, number, number, number]
	padding: { top: number; right: number; bottom: number; left: number }
}

export const WORLD_VIEW = {
	center: [8, 18] as [number, number],
	zoom: 2,
}

const DEFAULT_PADDING = { top: 96, right: 40, bottom: 40, left: 40 }

export const CONTINENT_VIEW_PRESETS: Record<
	GameContinent,
	ContinentViewPreset
> = {
	africa: {
		focusBounds: [
			[-25, -38],
			[60, 38],
		],
		maxBounds: [-35, -42, 65, 42],
		padding: DEFAULT_PADDING,
	},
	asia: {
		focusBounds: [
			[25, -10],
			[180, 78],
		],
		maxBounds: [15, -15, 185, 80],
		padding: DEFAULT_PADDING,
	},
	europe: {
		focusBounds: [
			[-25, 34],
			[45, 72],
		],
		maxBounds: [-30, 30, 50, 75],
		padding: DEFAULT_PADDING,
	},
	'north-america': {
		focusBounds: [
			[-170, 5],
			[-50, 84],
		],
		maxBounds: [-178, 0, -45, 86],
		padding: DEFAULT_PADDING,
	},
	'south-america': {
		focusBounds: [
			[-95, -60],
			[-30, 15],
		],
		maxBounds: [-100, -62, -25, 18],
		padding: DEFAULT_PADDING,
	},
	oceania: {
		focusBounds: [
			[110, -50],
			[240, 15],
		],
		maxBounds: [100, -55, 245, 20],
		padding: DEFAULT_PADDING,
	},
}
