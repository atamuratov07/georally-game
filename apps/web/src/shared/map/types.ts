import type { GameScope } from '@georally/game-domain'
import type { ReactNode } from 'react'

export type MapHighlightTone = 'correct' | 'wrong' | 'selected'

export interface MapHighlight {
	countryId: string
	tone: MapHighlightTone
}

export interface MapMarker {
	id: string
	longitude: number
	latitude: number
	element: ReactNode
	anchor?: 'bottom' | 'center' | 'top'
}

export interface MapRevealTarget {
	countryId: string
	longitude: number
	latitude: number
}

export interface PickCountryMapProps {
	onPick: (countryId: string) => void
	interactiveIds: ReadonlySet<string>
	scope: GameScope
	resetViewKey?: string | number | null
	highlights?: readonly MapHighlight[]
	markers?: readonly MapMarker[]
	revealTarget?: MapRevealTarget | null
	popupElement?: ReactNode | null
	disabled?: boolean
	className?: string
}
