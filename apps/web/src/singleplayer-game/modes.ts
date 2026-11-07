import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { SingleplayerModeId } from './paths'

export interface SingleplayerMode {
	id: SingleplayerModeId
	SetupPage: LazyExoticComponent<ComponentType>
	GamePage: LazyExoticComponent<ComponentType>
}

export const SINGLEPLAYER_MODES: readonly SingleplayerMode[] = [
	{
		id: 'locate',
		SetupPage: lazy(() => import('./locate/SetupPage')),
		GamePage: lazy(() => import('./locate/GamePage')),
	},
]
