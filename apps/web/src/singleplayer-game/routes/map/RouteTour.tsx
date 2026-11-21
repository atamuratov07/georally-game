import { pathLinks } from '@georally/game-domain/borders'
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl'
import { motion } from 'motion/react'
import { useEffect, useEffectEvent, useState } from 'react'
import { Layer, Source, useMap } from 'react-map-gl/maplibre'
import { prefersReducedMotion } from '@/shared/lib/prefersReducedMotion'
import { FLIGHT, fitCamera, type Insets } from '@/shared/map/camera/framing'
import { BeadLayers, LINE_BEADS_BOTTOM_ID } from './BeadLayers'
import { moveCamera } from './moveCamera'
import {
	beadData,
	beadsAlong,
	countryBead,
	WAY_GAP_PX,
	type PlacedBead,
} from './routeBeads'
import { routeFrame } from './routeFrame'
import {
	centroidOf,
	joinPaths,
	linkPath,
	partialPath,
	pathKm,
	pointAlong,
} from './routeGeometry'
import {
	lineData,
	NAVY,
	TOURED_CORD,
	TOURED_CORD_WIDTH,
	TOURED_RIM,
} from './routeLineStyle'

const HOLD_MS = 700
const DIVE_MS = 1100
const ZOOM_STEP = 1.2
const MAX_ZOOM = 5
const MIN_ZOOM = 2.5
const KM_PER_MS = 2.2
const MIN_MS = 1100
const MAX_MS = 4500
const SOURCE_ID = 'route-trail'
const NO_TRAIL = lineData([])
const NO_BEADS = beadData([])
const BEADS_ID = 'route-tour-beads'

const wait = (ms: number) =>
	new Promise<void>(resolve => setTimeout(resolve, ms))

interface TourCallbacks {
	onPuck: (top: number | null) => void
	onPassed: (passed: number) => void
	onDone: () => void
}

function playTour(
	map: MapLibreMap,
	chain: readonly string[],
	padding: Insets,
	{ onPuck, onPassed, onDone }: TourCallbacks,
): () => void {
	const bounds = routeFrame(chain)
	const whole = bounds && fitCamera(map, bounds, padding)
	const legs = pathLinks(chain).flatMap(link => {
		const path = linkPath(link)
		return path ? [path] : []
	})
	const path = joinPaths(legs)
	const totalKm = pathKm(path)
	const stops = legs.reduce<number[]>(
		(sums, leg) => [...sums, (sums.at(-1) ?? 0) + pathKm(leg) / totalKm],
		[],
	)
	const between = legs.flatMap((leg, i) => {
		const from = stops[i - 1] ?? 0
		return beadsAlong(leg, WAY_GAP_PX).map((bead): PlacedBead => ({
			bead: { ...bead, at: from + bead.at * (stops[i] - from) },
			main: true,
			kind: 'link',
		}))
	})
	const countries = chain.flatMap((id, i): PlacedBead[] => {
		const point = centroidOf(id)
		const end = i === 0 || i === chain.length - 1
		const at = i === 0 ? 0 : (stops[i - 1] ?? 1)
		return point
			? [
					{
						bead: countryBead(point, at),
						main: true,
						kind: end ? 'end' : 'country',
					},
				]
			: []
	})
	const beads = [...between, ...countries]
	const trail = (progress: number) => {
		map.getSource<GeoJSONSource>(SOURCE_ID)?.setData(
			lineData([{ path: partialPath(path, progress), main: true }]),
		)
		map.getSource<GeoJSONSource>(BEADS_ID)?.setData(
			beadData(beads.filter(({ bead }) => bead.at <= progress + 1e-6)),
		)
	}
	const controller = new AbortController()
	const { signal } = controller
	let frame = 0

	const stop = () => {
		controller.abort()
		cancelAnimationFrame(frame)
		window.removeEventListener('pointerdown', skip)
		window.removeEventListener('keydown', skip)
	}
	const end = () => {
		stop()
		trail(1)
		onPuck(null)
		onDone()
	}
	function skip() {
		if (signal.aborted) {
			return
		}
		map.stop()
		if (whole) {
			map.jumpTo(whole)
		}
		end()
	}

	if (!whole || path.length < 2 || prefersReducedMotion()) {
		skip()
		return stop
	}

	const view = {
		zoom: Math.min(
			Math.max((whole.zoom ?? 2) + ZOOM_STEP, MIN_ZOOM),
			MAX_ZOOM,
		),
		padding: whole.padding,
	}
	const height = map.getContainer().clientHeight
	const puckTop =
		whole.padding.top +
		(height - whole.padding.top - whole.padding.bottom) / 2
	const duration = Math.min(MAX_MS, Math.max(MIN_MS, totalKm / KM_PER_MS))
	const until = <T,>(promise: Promise<T>) =>
		promise.then(value => {
			if (signal.aborted) {
				throw signal.reason
			}
			return value
		})
	const travel = () =>
		new Promise<void>(resolve => {
			const startedAt = performance.now()
			const tick = (now: number) => {
				if (signal.aborted) {
					return
				}
				const progress = Math.min(1, (now - startedAt) / duration)
				const [longitude, latitude] = pointAlong(path, progress)
				map.jumpTo({ ...view, center: [longitude, latitude] })
				trail(progress)
				onPassed(stops.filter(stop => stop <= progress + 1e-6).length)
				if (progress < 1) {
					frame = requestAnimationFrame(tick)
				} else {
					resolve()
				}
			}
			frame = requestAnimationFrame(tick)
		})

	const script = async () => {
		await until(wait(HOLD_MS))
		await until(
			moveCamera(map, () =>
				map.flyTo({
					...view,
					center: [path[0][0], path[0][1]],
					duration: DIVE_MS,
					essential: true,
				}),
			),
		)
		onPuck(puckTop)
		await until(travel())
		onPuck(null)
		await until(
			moveCamera(map, () =>
				map.flyTo({ ...whole, ...FLIGHT, essential: true }),
			),
		)
		end()
	}

	window.addEventListener('pointerdown', skip)
	window.addEventListener('keydown', skip)
	script().catch((error: unknown) => {
		if (!signal.aborted) {
			throw error
		}
	})
	return stop
}

export function RouteTour({
	chain,
	padding,
	onDone,
}: {
	chain: readonly string[]
	padding: Insets
	onDone: () => void
}) {
	const map = useMap().current?.getMap()
	const [puckTop, setPuckTop] = useState<number | null>(null)
	const [passed, setPassed] = useState(0)
	const start = useEffectEvent((map: MapLibreMap) =>
		playTour(map, chain, padding, {
			onPuck: setPuckTop,
			onPassed: setPassed,
			onDone,
		}),
	)

	useEffect(() => (map ? start(map) : undefined), [map])

	return (
		<>
			<Source id={SOURCE_ID} type='geojson' data={NO_TRAIL}>
				<Layer
					id='route-trail'
					type='line'
					beforeId={LINE_BEADS_BOTTOM_ID}
					layout={{ 'line-cap': 'round', 'line-join': 'round' }}
					paint={{
						'line-color': TOURED_CORD,
						'line-width': TOURED_CORD_WIDTH,
					}}
				/>
			</Source>
			<Source id={BEADS_ID} type='geojson' data={NO_BEADS}>
				<BeadLayers
					id={BEADS_ID}
					rim={TOURED_RIM}
					grow={0.4}
					shadows={false}
				/>
			</Source>
			{puckTop === null ? null : <TourPuck top={puckTop} passed={passed} />}
		</>
	)
}

function TourPuck({ top, passed }: { top: number; passed: number }) {
	return (
		<motion.span
			aria-hidden='true'
			className='pointer-events-none absolute left-1/2 z-10 -mt-3.5 -ml-3.5 block size-7'
			style={{ top }}
			initial={{ scale: 0 }}
			animate={{ scale: 1 }}
			transition={{ type: 'spring', stiffness: 500, damping: 18 }}
		>
			<motion.span
				key={passed}
				className='block size-full rounded-full border-[5px] bg-white'
				style={{ borderColor: TOURED_RIM, boxShadow: `0 3px 0 ${NAVY}` }}
				initial={passed > 0 ? { scale: 1.35 } : false}
				animate={{ scale: 1 }}
				transition={{ type: 'spring', stiffness: 600, damping: 14 }}
			/>
		</motion.span>
	)
}
