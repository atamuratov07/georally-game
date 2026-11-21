import { createContext, useCallback, useEffect, useState } from 'react'
import { prefersReducedMotion } from '@/shared/lib/prefersReducedMotion'
import { runViewTransition } from '@/shared/lib/viewTransition'

export type IntroStage = 'intro' | 'flying' | 'done'

export const RouteIntroContext = createContext<IntroStage>('done')

const HOLD_MS = 350
const FLIGHT_MS = 650

export function useRouteIntro(idle: boolean, playing: boolean) {
	const [hadIntro] = useState(() => idle && !prefersReducedMotion())
	const [stage, setStage] = useState<IntroStage>(hadIntro ? 'intro' : 'done')
	const [shown, setShown] = useState(false)

	useEffect(() => {
		if (!hadIntro || !playing || !shown) {
			return
		}
		let cancelled = false
		const timer = setTimeout(() => {
			void runViewTransition('route-intro', FLIGHT_MS, () =>
				setStage('flying'),
			).then(() => {
				if (!cancelled) {
					setStage('done')
				}
			})
		}, HOLD_MS)
		return () => {
			cancelled = true
			clearTimeout(timer)
		}
	}, [hadIntro, playing, shown])

	const onShown = useCallback(() => setShown(true), [])

	return { stage, landed: hadIntro && stage === 'done', onShown }
}
