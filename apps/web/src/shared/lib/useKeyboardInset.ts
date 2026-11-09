import { useSyncExternalStore } from 'react'

const SETTLE_MS = 600

function subscribe(onChange: () => void): () => void {
	const viewport = window.visualViewport
	if (!viewport) {
		return () => undefined
	}

	let frame = 0
	let until = 0
	const tick = () => {
		onChange()
		frame = performance.now() < until ? requestAnimationFrame(tick) : 0
	}
	const follow = () => {
		until = performance.now() + SETTLE_MS
		if (!frame) frame = requestAnimationFrame(tick)
	}

	viewport.addEventListener('resize', follow)
	viewport.addEventListener('scroll', follow)
	window.addEventListener('focusin', follow)
	window.addEventListener('focusout', follow)
	return () => {
		cancelAnimationFrame(frame)
		viewport.removeEventListener('resize', follow)
		viewport.removeEventListener('scroll', follow)
		window.removeEventListener('focusin', follow)
		window.removeEventListener('focusout', follow)
	}
}

function getInset(): number {
	const viewport = window.visualViewport
	return viewport
		? Math.max(
				0,
				Math.round(
					document.documentElement.clientHeight -
						viewport.height -
						viewport.offsetTop,
				),
			)
		: 0
}

export function useKeyboardInset(): number {
	return useSyncExternalStore(subscribe, getInset, () => 0)
}
