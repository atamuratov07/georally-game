import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { SingleplayerModeId } from './paths'

export interface SingleplayerMode {
	id: SingleplayerModeId
	titleKey: string
	descriptionKey: string
	SetupPage: LazyExoticComponent<ComponentType>
	GamePage: LazyExoticComponent<ComponentType>
}

export const SINGLEPLAYER_MODES: readonly SingleplayerMode[] = [
	{
		id: 'locate',
		titleKey: 'singleplayer.modes.locate.title',
		descriptionKey: 'singleplayer.modes.locate.description',
		SetupPage: lazy(() => import('./locate/SetupPage')),
		GamePage: lazy(() => import('./locate/GamePage')),
	},
	{
		id: 'name-it',
		titleKey: 'singleplayer.modes.nameIt.title',
		descriptionKey: 'singleplayer.modes.nameIt.description',
		SetupPage: lazy(() => import('./name-it/SetupPage')),
		GamePage: lazy(() => import('./name-it/GamePage')),
	},
	{
		id: 'recall-sprint',
		titleKey: 'singleplayer.modes.recallSprint.title',
		descriptionKey: 'singleplayer.modes.recallSprint.description',
		SetupPage: lazy(() => import('./recall-sprint/SetupPage')),
		GamePage: lazy(() => import('./recall-sprint/GamePage')),
	},
]
