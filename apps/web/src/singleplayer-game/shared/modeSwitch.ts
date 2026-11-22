import { runViewTransition } from '@/shared/lib/viewTransition'
import { SINGLEPLAYER_MODES } from '../modes'
import type { SingleplayerModeId } from '../paths'

const CARD_SLIDE_MS = 320
const SHOWN_TIMEOUT_MS = 1000

let waiting: { mode: SingleplayerModeId; done: () => void } | null = null

function untilShown(mode: SingleplayerModeId): Promise<void> {
	waiting?.done()
	return new Promise(resolve => {
		const timer = window.setTimeout(done, SHOWN_TIMEOUT_MS)
		function done() {
			clearTimeout(timer)
			if (waiting?.done === done) waiting = null
			resolve()
		}
		waiting = { mode, done }
	})
}

export function setupShown(mode: SingleplayerModeId): void {
	if (waiting?.mode === mode) waiting.done()
}

/** The new page renders inside a router transition, so the snapshot waits for its `setupShown`. */
export async function switchMode(
	from: SingleplayerModeId,
	to: SingleplayerModeId,
	navigate: () => void,
): Promise<void> {
	const index = (id: SingleplayerModeId) =>
		SINGLEPLAYER_MODES.findIndex(mode => mode.id === id)
	const target = SINGLEPLAYER_MODES[index(to)]
	await target?.SetupPage.load().catch(() => undefined)
	await runViewTransition(
		index(to) > index(from) ? 'mode-next' : 'mode-prev',
		CARD_SLIDE_MS,
		() => {
			navigate()
			return untilShown(to)
		},
	)
}
