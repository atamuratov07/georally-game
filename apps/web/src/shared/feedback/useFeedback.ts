import type {
	FeedbackCategory,
	FeedbackReaction,
} from '@georally/game-protocol'
import { createContext, useContext } from 'react'
import type { ReactionModeParam } from '@/shared/analytics/track'

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

export interface ReactionRequest {
	mode: ReactionModeParam
	key: number
}

export interface ReactionRequestState {
	request: ReactionRequest | null
	requestReaction: (mode: ReactionModeParam) => void
	closeReaction: () => void
}

export const ReactionRequestContext =
	createContext<ReactionRequestState | null>(null)

function useReactionRequestState(): ReactionRequestState {
	const state = useContext(ReactionRequestContext)
	if (!state) {
		throw new Error('Reaction requests used outside a FeedbackProvider')
	}
	return state
}

export function useRequestReaction(): ReactionRequestState['requestReaction'] {
	return useReactionRequestState().requestReaction
}

export function usePendingReaction(): Omit<
	ReactionRequestState,
	'requestReaction'
> {
	const { request, closeReaction } = useReactionRequestState()
	return { request, closeReaction }
}
