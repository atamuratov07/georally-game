import type {
	PlayingRouteState,
	RouteBoard,
} from '@georally/game-domain/singleplayer/routes'
import type { RoutesInputState } from './useRoutesInput'

export interface RoutesControls {
	board: RouteBoard
	state: PlayingRouteState
	input: RoutesInputState
	onHint: () => void
	onGiveUp: () => void
}

export interface RoutesLayoutProps {
	controls: RoutesControls
	keyboardInset: number
}
