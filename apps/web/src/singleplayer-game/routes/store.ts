import { createGameStore } from '../shared/gameStore'
import { isRouteGame } from './routeGame'

export const routeGameStore = createGameStore(
	'georally.singleplayer.routes',
	isRouteGame,
)
