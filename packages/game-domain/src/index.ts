export {
	type CommandError,
	type DomainError,
	type SessionPreparationError,
} from './shared/errors'
export { pickRandomIds, type RandomNumberGenerator } from './shared/random'
export { err, ok, type Result } from './shared/result'
export { elapsedSeconds, type LocalDay } from './shared/time'
export {
	addDays,
	daysBetween,
	deriveStreak,
	weekday,
	type Streak,
} from './streak'
export {
	GAME_CONTINENTS,
	GAME_DIFFICULTIES,
	type CountryId,
	type GameContinent,
	type GameDifficulty,
	type GameQuestionSetConfig,
	type GameRegions,
	type GameScope,
} from './shared/types'
export {
	isGameRegions,
	isWholeWorld,
	normalizeGameRegions,
	normalizeRegions,
	regionsInclude,
} from './shared/regions'

export {
	getCountryIds,
	getCountryInfo,
	hasCountry,
	selectEligibleCountryIds,
} from './catalog/selectors'
export { prepareQuestionSet, type QuestionSet } from './catalog/questionSet'
export { type CountryPool, type CountryPoolEntry } from './catalog/types'
