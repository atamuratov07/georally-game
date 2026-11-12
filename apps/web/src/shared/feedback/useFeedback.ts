import type {
	FeedbackCategory,
	FeedbackReaction,
} from '@georally/game-protocol'
import { createContext, useContext } from 'react'

export interface FeedbackOptions {
	category?: FeedbackCategory
	reaction?: FeedbackReaction
	countryId?: string
}

export type OpenFeedback = (options?: FeedbackOptions) => void

export const FeedbackContext = createContext<OpenFeedback | null>(null)

export function useFeedback(): OpenFeedback {
	const openFeedback = useContext(FeedbackContext)
	if (!openFeedback) {
		throw new Error('useFeedback() used outside a FeedbackProvider')
	}
	return openFeedback
}
