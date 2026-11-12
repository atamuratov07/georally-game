import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { ReactionModeParam } from '@/shared/analytics/track'
import { FeedbackDialog, type FeedbackDraft } from './FeedbackDialog'
import {
	FeedbackContext,
	ReactionRequestContext,
	type FeedbackOptions,
	type ReactionRequest,
} from './useFeedback'
import { claimReactionPrompt } from './useReactionPrompt'

const EMPTY_DRAFT: FeedbackDraft = {
	category: 'other',
	message: '',
	contact: '',
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false)
	const [draft, setDraft] = useState(EMPTY_DRAFT)
	const [context, setContext] = useState<
		Pick<FeedbackOptions, 'reaction' | 'countryId'>
	>({})

	const [reactionRequest, setReactionRequest] =
		useState<ReactionRequest | null>(null)

	const requestReaction = useCallback((mode: ReactionModeParam) => {
		if (claimReactionPrompt(mode)) {
			setReactionRequest({ mode, key: Date.now() })
		}
	}, [])
	const closeReaction = useCallback(() => setReactionRequest(null), [])
	const reactionState = useMemo(
		() => ({ request: reactionRequest, requestReaction, closeReaction }),
		[reactionRequest, requestReaction, closeReaction],
	)

	const openFeedback = useCallback(
		({ category, ...rest }: FeedbackOptions = {}) => {
			if (category) setDraft(current => ({ ...current, category }))
			setContext(rest)
			setOpen(true)
		},
		[],
	)

	return (
		<FeedbackContext value={openFeedback}>
			<ReactionRequestContext value={reactionState}>
				{children}
			</ReactionRequestContext>
			<FeedbackDialog
				open={open}
				onOpenChange={setOpen}
				draft={draft}
				onDraftChange={setDraft}
				reaction={context.reaction}
				countryId={context.countryId}
				onSent={() => setDraft(EMPTY_DRAFT)}
			/>
		</FeedbackContext>
	)
}
