import { useEffect, useRef } from 'react'

type RoundsLike =
	| { phase: 'idle' }
	| { phase: 'answering' | 'revealed' | 'finished'; index: number }

export interface RoundEventHandlers<State> {
	onStart: (state: State, isRetry: boolean) => void
	onReveal: (state: State) => void
	onFinish: (state: State, durationMs: number | undefined) => void
}

export function useRoundEvents<State extends RoundsLike>(
	state: State | null,
	restored: boolean,
	handlers: RoundEventHandlers<State>,
): void {
	const restoredState = restored ? (state as RoundsLike | null) : null
	const previousPhaseRef = useRef<RoundsLike['phase'] | null>(
		restoredState?.phase ?? null,
	)
	const hasStartedOnceRef = useRef(restored)
	const gameStartedAtRef = useRef<number | null>(null)
	const lastRevealedIndexRef = useRef<number | null>(
		restoredState?.phase === 'revealed' ? restoredState.index : null,
	)
	const finishedTrackedRef = useRef(restoredState?.phase === 'finished')

	useEffect(() => {
		if (!state) {
			return
		}

		const round = state as RoundsLike
		const previousPhase = previousPhaseRef.current
		previousPhaseRef.current = round.phase

		if (
			round.phase === 'answering' &&
			previousPhase !== 'answering' &&
			previousPhase !== 'revealed'
		) {
			const isRetry = hasStartedOnceRef.current
			hasStartedOnceRef.current = true
			gameStartedAtRef.current = Date.now()
			lastRevealedIndexRef.current = null
			finishedTrackedRef.current = false
			handlers.onStart(state, isRetry)
		}

		if (
			round.phase === 'revealed' &&
			lastRevealedIndexRef.current !== round.index
		) {
			lastRevealedIndexRef.current = round.index
			handlers.onReveal(state)
		}

		if (round.phase === 'finished' && !finishedTrackedRef.current) {
			finishedTrackedRef.current = true
			const startedAt = gameStartedAtRef.current
			handlers.onFinish(
				state,
				startedAt === null ? undefined : Date.now() - startedAt,
			)
		}
	}, [handlers, state])
}
