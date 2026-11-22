import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { SettingTone } from '@/shared/widgets/SettingToggleGroup'
import type { SingleplayerModeId } from './paths'

export interface SingleplayerMode {
	id: SingleplayerModeId
	titleKey: string
	descriptionKey: string
	tone: SettingTone
	SetupPage: LazyExoticComponent<ComponentType>
	GamePage: LazyExoticComponent<ComponentType>
}

export const SINGLEPLAYER_MODES: readonly SingleplayerMode[] = [
	{
		id: 'locate',
		titleKey: 'singleplayer.modes.locate.title',
		descriptionKey: 'singleplayer.modes.locate.description',
		tone: 'sunflower',
		SetupPage: lazy(() => import('./locate/SetupPage')),
		GamePage: lazy(() => import('./locate/GamePage')),
	},
	{
		id: 'name-it',
		titleKey: 'singleplayer.modes.nameIt.title',
		descriptionKey: 'singleplayer.modes.nameIt.description',
		tone: 'ocean',
		SetupPage: lazy(() => import('./name-it/SetupPage')),
		GamePage: lazy(() => import('./name-it/GamePage')),
	},
	{
		id: 'recall-sprint',
		titleKey: 'singleplayer.modes.recallSprint.title',
		descriptionKey: 'singleplayer.modes.recallSprint.description',
		tone: 'coral',
		SetupPage: lazy(() => import('./recall-sprint/SetupPage')),
		GamePage: lazy(() => import('./recall-sprint/GamePage')),
	},
	{
		id: 'routes',
		titleKey: 'singleplayer.modes.routes.title',
		descriptionKey: 'singleplayer.modes.routes.description',
		tone: 'grass',
		SetupPage: lazy(() => import('./routes/SetupPage')),
		GamePage: lazy(() => import('./routes/GamePage')),
	},
]
