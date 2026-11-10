import type { MapChoice } from './sprintControls'

export interface ReviewControls {
	found: number
	total: number
	hasMissed: boolean
	map: MapChoice
	onStep: (direction: 1 | -1) => void
	onLeave: () => void
}
