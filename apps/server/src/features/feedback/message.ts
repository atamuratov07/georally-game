import type {
	FeedbackCategory,
	FeedbackReaction,
	FeedbackRequest,
} from '@georally/game-protocol'

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
	bug: '🐛 Bug',
	idea: '💡 Idea',
	map_data: '🗺️ Map data',
	other: '💬 Other',
}

const REACTION_EMOJI: Record<FeedbackReaction, string> = {
	negative: '😕',
	neutral: '😐',
	positive: '😍',
}

const USER_AGENT_MAX_LENGTH = 300

function joinPresent(parts: (string | undefined)[], separator: string) {
	return parts.filter(part => part).join(separator)
}

export function formatFeedbackMessage(
	feedback: FeedbackRequest,
	userAgent: string | undefined,
): string {
	const { context } = feedback

	const heading = joinPresent(
		[
			CATEGORY_LABELS[feedback.category],
			feedback.reaction && REACTION_EMOJI[feedback.reaction],
		],
		' · ',
	)
	const where = joinPresent(
		[
			context.locale,
			context.path,
			context.appVersion && `v${context.appVersion}`,
			context.countryId && `country ${context.countryId}`,
		],
		' · ',
	)

	return joinPresent(
		[
			heading,
			feedback.message,
			feedback.contact && `📮 ${feedback.contact}`,
			`🌐 ${where}`,
			userAgent && `📱 ${userAgent.slice(0, USER_AGENT_MAX_LENGTH)}`,
		],
		'\n\n',
	)
}
