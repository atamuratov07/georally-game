import type {
	RouteBoard,
	RouteLink,
	RouteMove,
} from '@georally/game-domain/singleplayer/routes'
import { useEffect, useMemo } from 'react'
import { Layer } from 'react-map-gl/maplibre'
import { LabelLayers } from '@/shared/map/layers/LabelLayers'
import {
	COUNTRY_LAYER,
	LABELS_BOTTOM_LAYER_ID,
	ROUTE_REVEALED_STATE,
	ROUTE_STATE,
	routeFillLayer,
	routeRevealedLayer,
	SOURCE_ID,
} from '@/shared/map/map-styles'
import { flagsFor, useFeatureState } from '@/shared/map/useFeatureState'
import { RouteLine } from './RouteLine'
import { RouteRings } from './RouteRings'
import { useRouteRings } from './useRouteRings'

const WORLD = { source: SOURCE_ID, sourceLayer: COUNTRY_LAYER }

export function RouteLayers({
	loaded,
	board,
	countryIds,
	links,
	revealedIds,
	move,
	pulseEnds,
	onLineSettled,
}: {
	loaded: boolean
	board: RouteBoard
	countryIds: readonly string[]
	links: readonly RouteLink[]
	revealedIds: readonly string[]
	move: RouteMove | null
	pulseEnds: boolean
	onLineSettled: (links: readonly RouteLink[]) => void
}) {
	const states = useMemo(
		() =>
			new Map<string, string>([
				...countryIds.map(id => [id, board.verdict(id)] as const),
				[board.startId, 'start'],
				[board.targetId, 'target'],
			]),
		[board, countryIds],
	)
	const revealed = useMemo(() => flagsFor(revealedIds), [revealedIds])
	const { rings, ringCountries, ringEnds, remove } = useRouteRings(board)

	useEffect(() => {
		if (move) {
			ringCountries(move.countryIds)
		}
	}, [move, ringCountries])

	useEffect(() => {
		if (pulseEnds) {
			ringEnds()
		}
	}, [pulseEnds, ringEnds])
	useFeatureState(loaded, WORLD, ROUTE_STATE, states)
	useFeatureState(loaded, WORLD, ROUTE_REVEALED_STATE, revealed)

	return (
		<>
			<Layer {...routeFillLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
			<Layer {...routeRevealedLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
			<RouteLine
				loaded={loaded}
				links={links}
				startId={board.startId}
				targetId={board.targetId}
				onSettled={onLineSettled}
			/>
			<LabelLayers countryIds={countryIds} namesAbovePoint />
			<RouteRings rings={rings} onDone={remove} />
		</>
	)
}
