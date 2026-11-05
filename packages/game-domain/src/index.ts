export {
	type CommandError,
	type DomainError,
	type SessionPreparationError,
} from './shared/errors'
export { pickRandomIds, type RandomNumberGenerator } from './shared/random'
export { err, ok, type Result } from './shared/result'
export { elapsedSeconds } from './shared/time'
export {
	GAME_CONTINENTS,
	GAME_DIFFICULTIES,
	GAME_SCOPES,
	type CountryId,
	type GameContinent,
	type GameDifficulty,
	type GameQuestionSetConfig,
	type GameScope,
} from './shared/types'

export {
	getCountryIds,
	getCountryInfo,
	hasCountry,
	selectEligibleCountryIds,
} from './catalog/selectors'
export {
	prepareQuestionSet,
	type QuestionSet,
} from './catalog/questionSet'
export { type CountryPool, type CountryPoolEntry } from './catalog/types'
