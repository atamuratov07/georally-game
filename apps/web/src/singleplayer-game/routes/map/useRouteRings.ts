import type {
	RouteBoard,
	RouteVerdict,
} from '@georally/game-domain/singleplayer/routes'
import { useCallback, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/shared/lib/prefersReducedMotion'

const END_DELAYS_S = [0, 0.22]
const RING_STEP_S = 0.12

const VERDICT_RING: Record<RouteVerdict, string> = {
	route: 'border-grass-400',
	near: 'border-sunflower-400',
	off: 'border-coral-500',
}

export interface Ring {
	key: string
	countryId: string
	className: string
	delay: number
}

export function useRouteRings(board: RouteBoard) {
	const [rings, setRings] = useState<readonly Ring[]>([])
	const counter = useRef(0)

	const add = useCallback((next: readonly Omit<Ring, 'key'>[]) => {
		if (prefersReducedMotion()) {
			return
		}
		setRings(current => [
			...current,
			...next.map(ring => ({
				...ring,
				key: `${ring.countryId}-${counter.current++}`,
			})),
		])
	}, [])

	const ringCountries = useCallback(
		(countryIds: readonly string[]) =>
			add(
				countryIds.map((countryId, i) => ({
					countryId,
					className: VERDICT_RING[board.verdict(countryId)],
					delay: i * RING_STEP_S,
				})),
			),
		[add, board],
	)

	const ringEnds = useCallback(
		() =>
			add(
				[board.startId, board.targetId].map((countryId, i) => ({
					countryId,
					className: 'border-white',
					delay: END_DELAYS_S[i],
				})),
			),
		[add, board],
	)

	const remove = useCallback(
		(key: string) =>
			setRings(current => current.filter(ring => ring.key !== key)),
		[],
	)

	return { rings, ringCountries, ringEnds, remove }
}
