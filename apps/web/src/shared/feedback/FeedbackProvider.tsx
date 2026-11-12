import { useCallback, useState, type ReactNode } from 'react'
import { FeedbackDialog, type FeedbackDraft } from './FeedbackDialog'
import { FeedbackContext, type FeedbackOptions } from './useFeedback'

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
			{children}
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
