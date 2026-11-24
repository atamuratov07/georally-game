export type CountryId = string

export const GAME_DIFFICULTIES = ['easy', 'medium', 'hard'] as const
export type GameDifficulty = (typeof GAME_DIFFICULTIES)[number]

export const GAME_CONTINENTS = [
	'asia',
	'europe',
	'oceania',
	'north-america',
	'south-america',
	'africa',
] as const
export type GameContinent = (typeof GAME_CONTINENTS)[number]

export type GameScope = GameContinent | 'all'

/** Empty means the whole world; see `normalizeRegions`. */
export type GameRegions = readonly GameContinent[]

export interface GameQuestionSetConfig {
	questionCount: number
	difficulty: GameDifficulty
	regions: GameRegions
}
