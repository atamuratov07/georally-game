import type { BestView } from '../shared/personalBests'
import type { SprintEndedBy } from '@georally/game-domain/singleplayer/recall-sprint'
import type { MapChoice } from './sprintControls'

export interface ReviewControls {
	found: number
	total: number
	endedBy: SprintEndedBy
	best: BestView | null
	missedCount: number
	position: number | null
	map: MapChoice
	onStep: (direction: 1 | -1) => void
	onLeave: () => void
}
