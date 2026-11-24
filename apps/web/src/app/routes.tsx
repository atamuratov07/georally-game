import type { RouteObject } from 'react-router-dom'
import HomePage from './HomePage'
import { masteryRoutes } from '../mastery'
import { singleplayerRoutes } from '../singleplayer-game'
import {
	MultiplayerHomePage,
	MultiplayerRoomHostPage,
	MultiplayerRoomPlayerPage,
} from '../multiplayer-game'

export const appRoutes: RouteObject[] = [
	{ index: true, element: <HomePage /> },
	...singleplayerRoutes,
	...masteryRoutes,
	{ path: 'multiplayer', element: <MultiplayerHomePage /> },
	{
		path: 'multiplayer/room/:roomCode',
		element: <MultiplayerRoomPlayerPage />,
	},
	{
		path: 'multiplayer/host/:roomCode',
		element: <MultiplayerRoomHostPage />,
	},
]
