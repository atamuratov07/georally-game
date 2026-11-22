import type {
	RouteBoard,
	RouteMove,
} from '@georally/game-domain/singleplayer/routes'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { useEffect, useEffectEvent, useRef } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { prefersReducedMotion } from '@/shared/lib/prefersReducedMotion'
import { FLIGHT, fitCamera, type Insets } from '@/shared/map/camera/framing'
import { moveCamera } from './moveCamera'
import { joinFrames, NEAR_CENTRE, routeFrame } from './routeFrame'
import { centroidOf } from './routeGeometry'

const FOLLOW_MS = 650
const REFRAME_MS = 250

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
	const framedPadding = useRef(padding)
	const onWay = (id: string) => board.verdict(id) !== 'off'

	const frameRoute = useEffectEvent((map: MapLibreMap, duration: number) => {
		const bounds = joinFrames(
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
			map.easeTo({ ...camera, duration, essential: true })
		}
	})

	const follow = useEffectEvent((map: MapLibreMap, move: RouteMove) => {
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
		if (outside) {
			frameRoute(map, FOLLOW_MS)
		}
	})

	useEffect(() => {
		if (map && move) {
			follow(map, move)
		}
	}, [map, move])

	useEffect(() => {
		if (map && padding !== framedPadding.current) {
			framedPadding.current = padding
			frameRoute(map, REFRAME_MS)
		}
	}, [map, padding])

	useEffect(() => {
		if (!map) {
			return
		}
		const onResize = () => frameRoute(map, REFRAME_MS)
		map.on('resize', onResize)
		return () => {
			map.off('resize', onResize)
		}
	}, [map])

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
