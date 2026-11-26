import type { ComponentType } from 'react'
import { DesktopNameLayout } from './DesktopNameLayout'
import {
	TOUCH_EDGE_GAP_PX,
	TOUCH_KEYBOARD_GAP_PX,
	TouchNameLayout,
} from './TouchNameLayout'
import type { NameRoundLayoutKind, NameRoundLayoutProps } from './types'

const MAIN_BUTTON_PX = 64

export interface NameRoundLayout {
	kind: NameRoundLayoutKind
	Component: ComponentType<NameRoundLayoutProps>
	// MapLibre's zoom buttons sit under the left column of buttons, on desktop only.
	navigationTop: (withTopStart: boolean) => string | null
	insets: (keyboardInset: number) => { top: number; bottom: number }
}

export const desktopLayout: NameRoundLayout = {
	kind: 'desktop',
	Component: DesktopNameLayout,
	navigationTop: withTopStart => (withTopStart ? '11.25rem' : '7.5rem'),
	insets: keyboardInset => ({ top: 72, bottom: 120 + keyboardInset }),
}

export const touchLayout: NameRoundLayout = {
	kind: 'touch',
	Component: TouchNameLayout,
	navigationTop: () => null,
	insets: keyboardInset => ({
		top: 144,
		bottom:
			MAIN_BUTTON_PX +
			(keyboardInset > 0
				? keyboardInset + TOUCH_KEYBOARD_GAP_PX
				: TOUCH_EDGE_GAP_PX),
	}),
}
