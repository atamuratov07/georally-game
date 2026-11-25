import type {
	CardId,
	CardRecord,
	ExtraNew,
	IntroPlan,
	LearnerSettings,
	Rating,
	Rechecks,
	ReviewLogEntry,
	SchedulingState,
} from './types'

export interface Scheduler {
	next(
		state: SchedulingState | null, // null for a card's first review
		rating: Rating,
		now: number,
	): SchedulingState
	retrievability(state: SchedulingState, now: number): number // 0 to 1
}

export interface MasteryMeta {
	settings: LearnerSettings
	plan: IntroPlan | null // null until the first scope is chosen
	rechecks: Rechecks
	extraNew: ExtraNew | null
	schedulerVersion: number | null // null until cards are first built
}

export interface MasteryRepository {
	loadCards(): Promise<CardRecord[]>
	loadLog(range?: { from: number; to: number }): Promise<ReviewLogEntry[]> // from inclusive, to exclusive
	loadReviewTimes(): Promise<number[]> // ascending
	loadMeta(): Promise<MasteryMeta>

	recordReview(
		cardId: CardId,
		compute: (
			current: CardRecord | undefined,
			recheckPending: boolean,
		) => { card: CardRecord; entry: ReviewLogEntry },
	): Promise<{ card: CardRecord; entry: ReviewLogEntry }>
	replaceCards(
		fromLog: (log: ReviewLogEntry[]) => CardRecord[],
		schedulerVersion: number,
	): Promise<void>

	saveSettings(settings: LearnerSettings): Promise<void>
	savePlan(plan: IntroPlan): Promise<void>
	saveExtraNew(extra: ExtraNew): Promise<void>
	requestRecheck(cardIds: CardId[], at: number): Promise<void>
}

export interface MasteryDeps {
	repository: MasteryRepository
	scheduler: Scheduler
}
