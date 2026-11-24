declare module 'virtual:region-map' {
	import type { GameContinent } from '@georally/game-domain'

	export const REGION_MAP_VIEWBOX: string
	export const REGION_PATHS: Record<GameContinent, string>
	export const REGION_SHAPES: Record<
		GameContinent,
		{ viewBox: string; path: string }
	>
}
