import type { ComponentType } from 'react'
import type { Insets } from '@/shared/map/camera/framing'
import type { RoutesLayoutProps } from '../routesControls'
import { DesktopRoutesLayout } from './DesktopRoutesLayout'
import { TouchRoutesLayout } from './TouchRoutesLayout'

const FINISH_PADDING: Insets = { top: 140, bottom: 110 }

export interface RoutesLayout {
	Component: ComponentType<RoutesLayoutProps>
	navigationTop: string | null
	projectionClassName: string
	padding: Insets
	finishPadding: Insets
	leaveClassName: string
	finishHeaderClassName: string
	journeyArrow: 'above' | 'below'
	finishHeaderMoves: boolean
}

export const desktopLayout: RoutesLayout = {
	Component: DesktopRoutesLayout,
	navigationTop: '11.25rem',
	projectionClassName: 'top-18 left-3',
	padding: { top: 150, bottom: 140 },
	finishPadding: FINISH_PADDING,
	leaveClassName: 'absolute top-4 left-3 z-30',
	finishHeaderClassName: 'px-4',
	journeyArrow: 'below',
	finishHeaderMoves: false,
}

export const touchLayout: RoutesLayout = {
	Component: TouchRoutesLayout,
	navigationTop: null,
	projectionClassName: 'top-36 left-3',
	padding: { top: 140, bottom: 210 },
	finishPadding: FINISH_PADDING,
	leaveClassName: 'absolute top-22 left-3 z-30',
	finishHeaderClassName: 'px-16',
	journeyArrow: 'above',
	finishHeaderMoves: true,
}
