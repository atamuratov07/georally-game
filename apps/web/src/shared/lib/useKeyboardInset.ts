import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void): () => void {
	const viewport = window.visualViewport
	if (!viewport) {
		return () => undefined
	}

	viewport.addEventListener('resize', onChange)
	viewport.addEventListener('scroll', onChange)
	return () => {
		viewport.removeEventListener('resize', onChange)
		viewport.removeEventListener('scroll', onChange)
	}
}

function getInset(): number {
	const viewport = window.visualViewport
	return viewport
		? Math.max(
				0,
				Math.round(
					window.innerHeight - viewport.height - viewport.offsetTop,
				),
			)
		: 0
}

export function useKeyboardInset(): number {
	return useSyncExternalStore(subscribe, getInset, () => 0)
}
