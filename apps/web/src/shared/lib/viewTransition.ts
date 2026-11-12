import { flushSync } from 'react-dom'

let current: ViewTransition | null = null

export function canAnimateViewTransitions(): boolean {
	return (
		typeof document.startViewTransition === 'function' &&
		!window.matchMedia('(prefers-reduced-motion: reduce)').matches
	)
}

export function runViewTransition(
	kind: string,
	durationMs: number,
	update: () => void,
): Promise<void> {
	if (!canAnimateViewTransitions()) {
		update()
		return Promise.resolve()
	}

	const root = document.documentElement
	root.dataset.viewTransition = kind
	root.style.setProperty('--view-transition-duration', `${durationMs}ms`)

	const transition = document.startViewTransition(() => flushSync(update))
	current = transition
	return transition.finished
		.catch(() => undefined)
		.finally(() => {
			if (current !== transition) {
				return
			}
			current = null
			delete root.dataset.viewTransition
			root.style.removeProperty('--view-transition-duration')
		})
}
