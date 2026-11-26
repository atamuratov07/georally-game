import { useMemo, useState } from 'react'
import { TOUCH_QUERY } from '@/shared/lib/touch'
import { useKeyboardInset } from '@/shared/lib/useKeyboardInset'
import { useMediaQuery } from '@/shared/lib/useMediaQuery'
import { useProjectionPreference } from '@/shared/map/useProjectionPreference'
import { desktopLayout, touchLayout } from './layouts'
import type { NameRoundLayoutKind, NameRoundSlots } from './types'

const NO_SLOTS: NameRoundSlots = {}

interface NameRoundScreenOptions {
	globeAllowed: boolean
	slots?: (kind: NameRoundLayoutKind) => NameRoundSlots
}

export type NameRoundScreen = ReturnType<typeof useNameRoundScreen>

// The state that the map and the controls layer share.
export function useNameRoundScreen({
	globeAllowed,
	slots,
}: NameRoundScreenOptions) {
	const layout = useMediaQuery(TOUCH_QUERY) ? touchLayout : desktopLayout
	const keyboardInset = useKeyboardInset()
	const [chosenProjection, setProjection] = useProjectionPreference()
	const [cardHidden, setCardHidden] = useState(false)
	const placed = slots?.(layout.kind) ?? NO_SLOTS
	const insets = useMemo(
		() => layout.insets(keyboardInset),
		[keyboardInset, layout],
	)

	return {
		layout,
		slots: placed,
		keyboardInset,
		insets,
		navigationTop: layout.navigationTop(placed.topStart != null),
		projection: globeAllowed ? chosenProjection : 'flat',
		globeAllowed,
		setProjection,
		cardHidden,
		setCardHidden,
	}
}
