import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { ControlTone } from '@/shared/ui'
import type { SingleplayerModeId } from './paths'

type PageModule = Promise<{ default: ComponentType }>
type LazyPage = LazyExoticComponent<ComponentType> & { load: () => PageModule }

export interface SingleplayerMode {
	id: SingleplayerModeId
	titleKey: string
	descriptionKey: string
	tone: ControlTone
	SetupPage: LazyPage
	GamePage: LazyExoticComponent<ComponentType>
}

function lazyPage(load: () => PageModule): LazyPage {
	return Object.assign(lazy(load), { load })
}

export const SINGLEPLAYER_MODES: readonly SingleplayerMode[] = [
	{
		id: 'locate',
		titleKey: 'singleplayer.modes.locate.title',
		descriptionKey: 'singleplayer.modes.locate.description',
		tone: 'sunflower',
		SetupPage: lazyPage(() => import('./locate/SetupPage')),
		GamePage: lazy(() => import('./locate/GamePage')),
	},
	{
		id: 'name-it',
		titleKey: 'singleplayer.modes.nameIt.title',
		descriptionKey: 'singleplayer.modes.nameIt.description',
		tone: 'ocean',
		SetupPage: lazyPage(() => import('./name-it/SetupPage')),
		GamePage: lazy(() => import('./name-it/GamePage')),
	},
	{
		id: 'recall-sprint',
		titleKey: 'singleplayer.modes.recallSprint.title',
		descriptionKey: 'singleplayer.modes.recallSprint.description',
		tone: 'coral',
		SetupPage: lazyPage(() => import('./recall-sprint/SetupPage')),
		GamePage: lazy(() => import('./recall-sprint/GamePage')),
	},
	{
		id: 'routes',
		titleKey: 'singleplayer.modes.routes.title',
		descriptionKey: 'singleplayer.modes.routes.description',
		tone: 'grass',
		SetupPage: lazyPage(() => import('./routes/SetupPage')),
		GamePage: lazy(() => import('./routes/GamePage')),
	},
]
