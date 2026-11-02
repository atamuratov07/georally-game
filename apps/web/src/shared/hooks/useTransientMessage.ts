import { useEffect, useState } from 'react'

const DEFAULT_VISIBLE_MS = 4000

export function useTransientMessage(
	message: string | null,
	visibleMs = DEFAULT_VISIBLE_MS,
): string | null {
	const [state, setState] = useState({ source: message, visible: message })

	// Adjust state while rendering when the source changes (no extra effect pass).
	if (state.source !== message) {
		setState({ source: message, visible: message })
	}

	useEffect(() => {
		if (!state.visible) return
		const timeoutId = setTimeout(() => {
			setState(current => ({ ...current, visible: null }))
		}, visibleMs)
		return () => clearTimeout(timeoutId)
	}, [state.visible, visibleMs])

	return state.visible
}
