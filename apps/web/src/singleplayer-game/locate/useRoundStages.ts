import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import {
	canAnimateViewTransitions,
	runViewTransition,
} from '@/shared/lib/viewTransition'

export type RoundStage = 'intro' | 'ready' | 'header' | 'swapping' | 'round'

const INTRO_MIN_MS = 900
const GO_BEAT_MS = 300
const COLLAPSE_MS = 520
const EXPAND_MS = 300
const ROUND_HOLD_MS = 350
const CONTRACT_MS = 200

function wait(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms))
}

interface RoundStagesOptions {
	showIntro: boolean
	hasNextRound: boolean
	onBegin: (startsAt: number) => void
	onNext: (startsAt: number) => void
}

export function useRoundStages({
	showIntro,
	hasNextRound,
	onBegin,
	onNext,
}: RoundStagesOptions) {
	const [stage, setStage] = useState<RoundStage>(
		showIntro ? 'intro' : 'header',
	)
	const [introShownAt] = useState(() => Date.now())
	const mountedRef = useRef(false)

	useEffect(() => {
		mountedRef.current = true
		return () => {
			mountedRef.current = false
		}
	}, [])

	const playIntro = useCallback(async () => {
		await wait(Math.max(0, INTRO_MIN_MS - (Date.now() - introShownAt)))
		if (!mountedRef.current) return
		setStage('ready')

		await wait(GO_BEAT_MS)
		if (!mountedRef.current) return
		const animated = canAnimateViewTransitions()
		await runViewTransition('collapse', COLLAPSE_MS, () => {
			setStage('header')
			onBegin(Date.now() + (animated ? COLLAPSE_MS : 0))
		})
	}, [introShownAt, onBegin])

	const handleMapReady = useCallback(() => {
		if (stage === 'intro') {
			void playIntro()
		}
	}, [playIntro, stage])

	const playNext = useCallback(async () => {
		if (!hasNextRound || !canAnimateViewTransitions()) {
			onNext(Date.now())
			return
		}

		flushSync(() => setStage('swapping'))
		await runViewTransition('expand', EXPAND_MS, () => {
			onNext(Date.now() + EXPAND_MS + ROUND_HOLD_MS + CONTRACT_MS)
			setStage('round')
		})

		await wait(ROUND_HOLD_MS)
		if (!mountedRef.current) return
		await runViewTransition('contract', CONTRACT_MS, () => setStage('header'))
	}, [hasNextRound, onNext])

	const handleNext = useCallback(() => {
		if (stage === 'header') {
			void playNext()
		}
	}, [playNext, stage])

	return { stage, handleMapReady, handleNext }
}
