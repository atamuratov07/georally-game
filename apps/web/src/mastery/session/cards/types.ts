import type { AnswerOutcome } from '@georally/mastery'

export interface ReviewCardProps {
	countryId: string
	turn: number
	startedAt: number | null
	saving: boolean
	onReady: () => void
	onAnswer: (outcome: AnswerOutcome, at: number) => void
	onNext: () => void
}
