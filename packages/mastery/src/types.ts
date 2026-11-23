import type { CountryId, GameRegions } from '@georally/game-domain'

export const SKILL_IDS = ['locate'] as const
export type SkillId = (typeof SKILL_IDS)[number]
export type CardId = `${CountryId}:${SkillId}`

export type Rating = 'again' | 'hard' | 'good' | 'easy'
export type CardPhase = 'learning' | 'review' | 'relearning'
export type ReviewKind = 'new' | 'due' | 'recheck'

export type AnswerInput = 'mouse' | 'touch' | 'typing' | 'voice'

export interface SingleAnswerOutcome {
	shape: 'single'
	result: 'correct' | 'wrong' | 'timeUp' | 'giveUp'
	responseMs: number
	wrongAttempts: number
	input: AnswerInput | null
}

export type AnswerOutcome = SingleAnswerOutcome

export interface ReviewLogEntry {
	id: string
	cardId: CardId
	reviewedAt: number
	kind: ReviewKind
	outcome: AnswerOutcome
	rating: Rating
}

export interface SchedulingState {
	due: number // epoch ms
	stability: number // days until recall chance falls to 90%
	difficulty: number // 1 to 10
	phase: CardPhase
	learningStep: number
	reps: number
	lapses: number
	lastReviewedAt: number // epoch ms
}

export interface CardRecord {
	id: CardId
	countryId: CountryId
	skillId: SkillId
	introducedAt: number
	scheduling: SchedulingState
}

export interface IntroPlan {
	scopes: { regions: GameRegions; addedAt: number }[]
	seed: number
	acceptedMisses: CardId[]
}

export type Pace = 'relaxed' | 'steady' | 'intense'

export interface LearnerSettings {
	pace: Pace
	pausedSkills: SkillId[]
}

export type Rechecks = Partial<Record<CardId, number>>
