import { aliasEntries } from '@georally/country-catalog/aliases'
import { createAnswerMatcher } from '@georally/game-domain/answers'

export const answerMatcher = createAnswerMatcher(aliasEntries)
