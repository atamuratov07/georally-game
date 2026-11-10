import type { GameScope } from '@georally/game-domain'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { reviewOrder } from './reviewOrder'

export function useReview(
	missedIds: readonly string[] | null,
	scope: GameScope,
) {
	const order = useMemo(
		() => (missedIds ? reviewOrder(missedIds, scope) : []),
		[missedIds, scope],
	)
	const [activeId, setActiveId] = useState<string | null>(null)
	const [cursor, setCursor] = useState(-1)

	const select = useCallback(
		(countryId: string | null) => {
			setActiveId(countryId)
			const index = countryId ? order.indexOf(countryId) : -1
			if (index >= 0) {
				setCursor(index)
			}
		},
		[order],
	)

	const step = useCallback(
		(direction: 1 | -1) => {
			if (order.length === 0) {
				return
			}
			const next =
				cursor < 0
					? direction > 0
						? 0
						: order.length - 1
					: (cursor + direction + order.length) % order.length
			setCursor(next)
			setActiveId(order[next])
		},
		[cursor, order],
	)

	useEffect(() => {
		if (!missedIds) {
			return
		}
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'ArrowLeft') {
				step(-1)
			} else if (event.key === 'ArrowRight') {
				step(1)
			} else if (event.key === 'Escape') {
				select(null)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [missedIds, select, step])

	return { hasMissed: order.length > 0, activeId, select, step }
}
