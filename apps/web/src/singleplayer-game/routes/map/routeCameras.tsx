import type {
	RouteBoard,
	RouteMove,
} from '@georally/game-domain/singleplayer/routes'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { useEffect, useEffectEvent } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { prefersReducedMotion } from '@/shared/lib/prefersReducedMotion'
import { FLIGHT, fitCamera, type Insets } from '@/shared/map/camera/framing'
import { moveCamera } from './moveCamera'
import { joinFrames, NEAR_CENTRE, routeFrame } from './routeFrame'
import { centroidOf } from './routeGeometry'

const FOLLOW_MS = 650

export function FollowCamera({
	board,
	knownIds,
	move,
	padding,
}: {
	board: RouteBoard
	knownIds: readonly string[]
	move: RouteMove | null
	padding: Insets
}) {
	const map = useMap().current?.getMap()

	const follow = useEffectEvent((map: MapLibreMap, move: RouteMove) => {
		const onWay = (id: string) => board.verdict(id) !== 'off'
		const container = map.getContainer()
		const outside = move.countryIds.filter(onWay).some(id => {
			const point = centroidOf(id)
			if (!point) {
				return false
			}
			const { x, y } = map.project([point[0], point[1]])
			return (
				x < 0 ||
				x > container.clientWidth ||
				y < padding.top ||
				y > container.clientHeight - padding.bottom
			)
		})
		const bounds =
			outside &&
			joinFrames(
				routeFrame([board.startId, board.targetId]),
				routeFrame(knownIds.filter(onWay), NEAR_CENTRE),
			)
		const camera = bounds && fitCamera(map, bounds, padding)
		if (!camera) {
			return
		}
		if (prefersReducedMotion()) {
			map.jumpTo(camera)
		} else {
			map.easeTo({ ...camera, duration: FOLLOW_MS, essential: true })
		}
	})

	useEffect(() => {
		if (map && move) {
			follow(map, move)
		}
	}, [map, move])

	return null
}

export function FinishCamera({
	chain,
	padding,
	onDone,
}: {
	chain: readonly string[]
	padding: Insets
	onDone: () => void
}) {
	const map = useMap().current?.getMap()
	const done = useEffectEvent(onDone)

	useEffect(() => {
		const bounds = routeFrame(chain)
		const camera = map && bounds && fitCamera(map, bounds, padding)
		if (!map || !camera) {
			done()
			return
		}
		if (prefersReducedMotion()) {
			map.jumpTo(camera)
			done()
			return
		}
		let cancelled = false
		void moveCamera(map, () =>
			map.flyTo({ ...camera, ...FLIGHT, essential: true }),
		).then(() => {
			if (!cancelled) {
				done()
			}
		})
		return () => {
			cancelled = true
		}
	}, [chain, map, padding])

	return null
}
