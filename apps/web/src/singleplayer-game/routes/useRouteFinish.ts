import {
	getFinalChain,
	isPerfect,
	type RouteBoard,
	type RouteState,
} from '@georally/game-domain/singleplayer/routes'
import { useCallback, useMemo, useState } from 'react'
import { celebrate } from '@/shared/lib/confetti'

export type FinishCamera = 'tour' | 'flight' | null

export function useRouteFinish(
	board: RouteBoard,
	state: RouteState,
	lineSettled: boolean,
) {
	const [restored] = useState(state.phase === 'finished')
	const [moved, setMoved] = useState(false)
	const finished = state.phase === 'finished' ? state : null
	const chain = useMemo(
		() => (finished ? getFinalChain(board, finished) : null),
		[board, finished],
	)
	const perfect = isPerfect(board, state)
	const camera: FinishCamera =
		!finished || restored
			? null
			: finished.outcome === 'gaveUp'
				? 'flight'
				: lineSettled || moved
					? 'tour'
					: null

	const onMoved = useCallback(() => {
		setMoved(true)
		if (perfect) {
			celebrate()
		}
	}, [perfect])

	return {
		chain,
		camera,
		onMoved,
		restored,
		actionShown: restored || (moved && lineSettled),
	}
}
