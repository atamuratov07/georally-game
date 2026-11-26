import type { Attempt } from '@georally/game-domain/singleplayer/name-it'
import type { ComponentProps, ReactNode } from 'react'
import type { AnswerStage, RevealedAnswer } from '../answering/useAnswerField'
import type { AnswerInputState } from '../answering/useAnswerInput'
import type { CountdownBar } from '../hud/CountdownBar'

export interface NameRoundControls {
	stage: AnswerStage
	answer: RevealedAnswer | null
	lastAttempt: Attempt | null
	input: AnswerInputState
	timer: Omit<ComponentProps<typeof CountdownBar>, 'variant'>
	canGiveUp: boolean
	onGiveUp: () => void
	nextPending?: boolean // Next waits for the owner, e.g. a save
	onNext: () => void
}

export type NameRoundLayoutKind = 'desktop' | 'touch'

export interface NameRoundSlots {
	topStart?: ReactNode // one button, above the map toggles
	topEnd?: ReactNode // the opposite corner on desktop, the answer field's end on touch
	overlay?: ReactNode // positions itself
}

export interface NameRoundLayoutProps {
	controls: NameRoundControls
	slots: NameRoundSlots
	projectionToggle: ReactNode
	cardToggle: ReactNode
	keyboardInset: number
}
