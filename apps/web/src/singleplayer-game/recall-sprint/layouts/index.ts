import type { ComponentType } from 'react'
import type { Overlays } from '@/shared/map/camera/framing'
import type { ReviewControls } from '../reviewControls'
import type { SprintLayoutProps } from '../sprintControls'
import { DesktopReviewLayout } from './DesktopReviewLayout'
import { DesktopSprintLayout } from './DesktopSprintLayout'
import {
	TOUCH_EDGE_GAP_PX,
	TOUCH_KEYBOARD_GAP_PX,
	TouchSprintLayout,
} from './TouchSprintLayout'
import { TouchReviewLayout } from './TouchReviewLayout'

const MAIN_BUTTON_PX = 64
const TOUCH_BAR_BOTTOM_PX = 76
const NO_COVER_REVIEW: Overlays = {
	padding: { top: 72, bottom: 96 },
	cover: { top: 0, bottom: 0 },
}

export interface SprintLayout {
	Component: ComponentType<SprintLayoutProps>
	navigationTop: string | null
	overlays: (keyboardInset: number) => Overlays
	Review: ComponentType<{ controls: ReviewControls }>
	reviewOverlays: Overlays
}

export const desktopLayout: SprintLayout = {
	Component: DesktopSprintLayout,
	Review: DesktopReviewLayout,
	reviewOverlays: NO_COVER_REVIEW,
	navigationTop: '11.25rem',
	overlays: keyboardInset => ({
		padding: { top: 72, bottom: 120 + keyboardInset },
		cover: { top: 0, bottom: keyboardInset },
	}),
}

export const touchLayout: SprintLayout = {
	Component: TouchSprintLayout,
	Review: TouchReviewLayout,
	reviewOverlays: NO_COVER_REVIEW,
	navigationTop: null,
	overlays: keyboardInset => ({
		padding: {
			top: 144,
			bottom:
				MAIN_BUTTON_PX +
				(keyboardInset > 0
					? keyboardInset + TOUCH_KEYBOARD_GAP_PX
					: TOUCH_EDGE_GAP_PX),
		},
		cover: { top: TOUCH_BAR_BOTTOM_PX, bottom: keyboardInset },
	}),
}
