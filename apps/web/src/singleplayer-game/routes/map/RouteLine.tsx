import type { RouteLink } from '@georally/game-domain/singleplayer/routes'
import type { GeoJSONSource } from 'maplibre-gl'
import { useEffect, useEffectEvent, useRef } from 'react'
import { Layer, Source, useMap } from 'react-map-gl/maplibre'
import { prefersReducedMotion } from '@/shared/lib/prefersReducedMotion'
import { LABELS_BOTTOM_LAYER_ID } from '@/shared/map/map-styles'
import { BeadLayers, LINE_BEADS_ID } from './BeadLayers'
import {
	beadData,
	beadsAlong,
	BRANCH_GAP_PX,
	countryBead,
	WAY_GAP_PX,
	type Bead,
	type PlacedBead,
} from './routeBeads'
import {
	centroidOf,
	linkPath,
	partialPath,
	pathKm,
	type Point,
} from './routeGeometry'
import {
	BRANCH_CORD_WIDTH,
	lineData,
	NAVY,
	OFF_WAY,
	ON_WAY,
	ROUTE_CORD_WIDTH,
	type LineDraft,
} from './routeLineStyle'

const SOURCE_ID = 'route-line'
const KM_PER_MS = 1.5
const MIN_LINK_MS = 350
const MAX_LINK_MS = 1400
const EMPTY = lineData([])
const LINE_LAYOUT = { 'line-cap': 'round', 'line-join': 'round' } as const
const NO_BEADS = beadData([])

const easeInOut = (t: number) =>
	t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2

const keyOf = ({ link: [from, to] }: RouteLink) => `${from}-${to}`

interface Drawn extends RouteLink {
	key: string
	path: Point[]
	beads: { onWay: boolean; along: Bead[] } | null
	ms: number
	addedAt: number
	startedAt: number | null
	done: boolean
}

interface RouteLineProps {
	loaded: boolean
	links: readonly RouteLink[]
	startId: string
	targetId: string
	/** Passes back the exact `links` array it finished growing. */
	onSettled: (links: readonly RouteLink[]) => void
}

export function RouteLine({
	loaded,
	links,
	startId,
	targetId,
	onSettled,
}: RouteLineProps) {
	const map = useMap().current?.getMap()
	const drawn = useRef<Drawn[] | null>(null)
	const reachedAt = useRef(new Map<string, number>())
	const frame = useRef(0)
	const settle = useEffectEvent(() => onSettled(links))

	useEffect(
		() => () => {
			cancelAnimationFrame(frame.current)
			frame.current = 0
		},
		[],
	)

	useEffect(() => {
		if (!loaded || !map?.getSource(SOURCE_ID)) {
			return
		}
		const now = performance.now()
		const restored = drawn.current === null
		const previous = drawn.current ?? []
		const latest = new Map(links.map(link => [keyOf(link), link]))
		for (const item of previous) {
			item.onWay = latest.get(item.key)?.onWay ?? item.onWay
		}
		const known = new Set(previous.map(({ key }) => key))
		const added = links
			.filter(link => !known.has(keyOf(link)))
			.map((link): Drawn => {
				const path = linkPath(link.link) ?? []
				return {
					...link,
					key: keyOf(link),
					path,
					beads: null,
					ms: Math.min(
						MAX_LINK_MS,
						Math.max(MIN_LINK_MS, pathKm(path) / KM_PER_MS),
					),
					addedAt: now,
					startedAt: null,
					done: false,
				}
			})
		drawn.current = [...previous, ...added]
		for (const end of [startId, targetId]) {
			if (!reachedAt.current.has(end)) {
				reachedAt.current.set(end, now)
			}
		}

		const draw = (time: number) => {
			const lines: LineDraft[] = []
			const beads: PlacedBead[] = []
			for (const item of drawn.current ?? []) {
				if (item.startedAt === null && !item.done) {
					continue
				}
				const progress = item.done
					? 1
					: easeInOut(Math.min(1, (time - item.startedAt!) / item.ms))
				const main = item.onWay
				lines.push({ path: partialPath(item.path, progress), main })
				if (item.beads?.onWay !== main) {
					item.beads = {
						onWay: main,
						along: beadsAlong(
							item.path,
							main ? WAY_GAP_PX : BRANCH_GAP_PX,
						),
					}
				}
				for (const bead of item.beads.along) {
					if (bead.at <= progress) {
						beads.push({ bead, main, kind: 'link' })
					}
				}
			}
			const onWay = new Set(
				(drawn.current ?? [])
					.filter(item => item.onWay)
					.flatMap(item => item.link),
			)
			for (const [id, at] of reachedAt.current) {
				const point = centroidOf(id)
				if (!point || at > time) {
					continue
				}
				const end = id === startId || id === targetId
				beads.push({
					bead: countryBead(point, 0),
					main: end || onWay.has(id),
					kind: end ? 'end' : 'country',
				})
			}
			map.getSource<GeoJSONSource>(SOURCE_ID)?.setData(lineData(lines))
			map.getSource<GeoJSONSource>(LINE_BEADS_ID)?.setData(beadData(beads))
		}

		if (restored || prefersReducedMotion()) {
			cancelAnimationFrame(frame.current)
			frame.current = 0
			for (const item of drawn.current) {
				item.done = true
				reachedAt.current.set(item.link[1], now)
			}
			draw(now)
			settle()
			return
		}
		if (frame.current !== 0) {
			return
		}
		if (drawn.current.every(({ done }) => done)) {
			settle()
			return
		}

		const tick = (time: number) => {
			const all = drawn.current ?? []
			for (const item of all) {
				const from = reachedAt.current.get(item.link[0])
				if (item.startedAt === null && from !== undefined) {
					item.startedAt = Math.min(time, Math.max(from, item.addedAt))
				}
				if (
					!item.done &&
					item.startedAt !== null &&
					time - item.startedAt >= item.ms
				) {
					item.done = true
					reachedAt.current.set(item.link[1], item.startedAt + item.ms)
				}
			}
			draw(time)
			if (all.some(({ done }) => !done)) {
				frame.current = requestAnimationFrame(tick)
				return
			}
			frame.current = 0
			settle()
		}
		frame.current = requestAnimationFrame(tick)
	}, [links, loaded, map, startId, targetId])

	return (
		<>
			<Source id={SOURCE_ID} type='geojson' data={EMPTY}>
				<Layer
					id='route-branch-cord'
					type='line'
					filter={OFF_WAY}
					beforeId={LABELS_BOTTOM_LAYER_ID}
					layout={LINE_LAYOUT}
					paint={{ 'line-color': NAVY, 'line-width': BRANCH_CORD_WIDTH }}
				/>
				<Layer
					id='route-cord-shadow'
					type='line'
					filter={ON_WAY}
					beforeId={LABELS_BOTTOM_LAYER_ID}
					layout={LINE_LAYOUT}
					paint={{
						'line-color': NAVY,
						'line-opacity': 0.3,
						'line-translate': [0, 2.5],
						'line-width': ROUTE_CORD_WIDTH,
					}}
				/>
				<Layer
					id='route-cord'
					type='line'
					filter={ON_WAY}
					beforeId={LABELS_BOTTOM_LAYER_ID}
					layout={LINE_LAYOUT}
					paint={{ 'line-color': NAVY, 'line-width': ROUTE_CORD_WIDTH }}
				/>
			</Source>
			<Source id={LINE_BEADS_ID} type='geojson' data={NO_BEADS}>
				<BeadLayers id={LINE_BEADS_ID} rim={NAVY} shadows />
			</Source>
		</>
	)
}
