import type { ComponentType } from 'react'
import type { RoundLayoutProps } from '../roundControls'
import { DesktopRoundLayout } from './DesktopRoundLayout'
import {
	TOUCH_EDGE_GAP_PX,
	TOUCH_KEYBOARD_GAP_PX,
	TouchRoundLayout,
} from './TouchRoundLayout'

const MAIN_BUTTON_PX = 64

export const TOUCH_QUERY = '(pointer: coarse)'

export interface RoundLayout {
	Component: ComponentType<RoundLayoutProps>
	navigationTop: string | null
	insets: (keyboardInset: number) => { top: number; bottom: number }
}

export const desktopLayout: RoundLayout = {
	Component: DesktopRoundLayout,
	navigationTop: '11.25rem',
	insets: keyboardInset => ({ top: 72, bottom: 120 + keyboardInset }),
}

export const touchLayout: RoundLayout = {
	Component: TouchRoundLayout,
	navigationTop: null,
	insets: keyboardInset => ({
		top: 144,
		bottom:
			MAIN_BUTTON_PX +
			(keyboardInset > 0
				? keyboardInset + TOUCH_KEYBOARD_GAP_PX
				: TOUCH_EDGE_GAP_PX),
	}),
}
