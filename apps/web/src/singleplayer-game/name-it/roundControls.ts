import type { Attempt } from '@georally/game-domain/singleplayer/name-it'
import type { ComponentProps } from 'react'
import type { ProjectionKind } from '@/shared/map/ProjectionToggle'
import type { ScoreBanner } from '@/shared/widgets/ScoreBanner'
import type { AnswerInputState } from './useAnswerInput'

export type AnswerStage = 'waiting' | 'answering' | 'revealed'

export interface RevealedAnswer {
	name: string
	correct: boolean
}

export interface RoundControls {
	stage: AnswerStage
	answer: RevealedAnswer | null
	lastAttempt: Attempt | null
	input: AnswerInputState
	progress: { current: number; total: number }
	timer: {
		deadlineAt: number | null
		frozenAt: number | null
		limitMs: number
	}
	score: Omit<ComponentProps<typeof ScoreBanner>, 'className'>
	map: {
		projection: ProjectionKind
		globeAllowed: boolean
		onProjectionChange: (projection: ProjectionKind) => void
		hasCard: boolean
		cardHidden: boolean
		onCardHiddenChange: (hidden: boolean) => void
	}
	canGiveUp: boolean
	onGiveUp: () => void
	onNext: () => void
}

export interface RoundLayoutProps {
	controls: RoundControls
	keyboardInset: number
}
