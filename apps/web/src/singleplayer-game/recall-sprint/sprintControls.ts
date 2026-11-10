import type { GameScope } from '@georally/game-domain'
import type { ProjectionKind } from '@/shared/map/ProjectionToggle'
import type { SprintInputState } from './useSprintInput'

export interface MapChoice {
	projection: ProjectionKind
	globeAllowed: boolean
	onProjectionChange: (projection: ProjectionKind) => void
}

export interface SprintControls {
	input: SprintInputState
	scope: GameScope
	found: number
	total: number
	timer: { deadlineAt: number | null; frozenAt: null; limitMs: number }
	onLeave: () => void
	onFinish: () => void
	map: MapChoice
}

export interface SprintLayoutProps {
	controls: SprintControls
	keyboardInset: number
}
