import {
	createRouteBoard,
	type RouteBoard,
	type RouteEnds,
} from '@georally/game-domain/singleplayer/routes'
import { useEffect, useState } from 'react'

export function useLazyBoard(ends: RouteEnds | null): RouteBoard | null {
	const [loaded, setLoaded] = useState<{
		ends: RouteEnds
		board: RouteBoard | null
	} | null>(null)

	useEffect(() => {
		if (!ends) return
		let live = true
		void import('@georally/country-catalog/borders').then(
			({ borderGraph }) => {
				if (live)
					setLoaded({ ends, board: createRouteBoard(borderGraph, ends) })
			},
		)
		return () => {
			live = false
		}
	}, [ends])

	return loaded && loaded.ends === ends ? loaded.board : null
}
