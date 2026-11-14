import { LngLat, type Map as MapLibreMap } from 'maplibre-gl'

export type Bounds = readonly [
	west: number,
	south: number,
	east: number,
	north: number,
]

export interface Insets {
	top: number
	bottom: number
}

export interface Overlays {
	padding: Insets
	cover: Insets
}

interface FrameOptions {
	margin?: number
	maxZoom?: number
}

export const FLIGHT = { curve: 1.42, speed: 1.4 } as const
export const MAX_FIT_ZOOM = 5.5

const FIT_MARGIN = 0.2
const MIN_FREE_PX = 40
const TILE_PX = 512
const MAX_CENTER_LATITUDE = 85
const TINY_PX = 14

function latitudeAt(mercator: number): number {
	return (
		(360 / Math.PI) * Math.atan(Math.exp(Math.PI * (1 - 2 * mercator))) - 90
	)
}

function mercatorY(latitude: number): number {
	const radians = (latitude * Math.PI) / 180
	return (
		(1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2
	)
}

export function isTinyAt([west, south, east, north]: Bounds, zoom: number) {
	const worldPx = TILE_PX * 2 ** zoom
	const longitudeSpan = east >= west ? east - west : east + 360 - west
	const width = (longitudeSpan / 360) * worldPx
	const height = (mercatorY(south) - mercatorY(north)) * worldPx
	return Math.max(width, height) < TINY_PX
}

interface FitPadding {
	map: { top: number; bottom: number }
	fit: { top: number; bottom: number; left: number; right: number }
}

function fitPadding(
	width: number,
	height: number,
	{ top, bottom }: Insets,
	margin: number,
): FitPadding {
	const coveredBottom = Math.min(
		bottom,
		Math.max(height - top - MIN_FREE_PX, 0),
	)
	const freeHeight = Math.max(height - top - coveredBottom, MIN_FREE_PX)
	const side = Math.round(width * margin)
	const vertical = Math.round(freeHeight * margin)
	return {
		map: { top, bottom: coveredBottom },
		fit: { top: vertical, bottom: vertical, left: side, right: side },
	}
}

export function viewPadding(
	width: number,
	height: number,
	insets: Insets,
	margin = FIT_MARGIN,
) {
	const { map, fit } = fitPadding(width, height, insets, margin)
	return {
		top: map.top + fit.top,
		bottom: map.bottom + fit.bottom,
		left: fit.left,
		right: fit.right,
	}
}

function corners([west, south, east, north]: Bounds) {
	return [
		[west, south],
		[east, north],
	] as [[number, number], [number, number]]
}

export function overlayPadding(map: MapLibreMap, insets: Insets) {
	const container = map.getContainer()
	const { map: padding } = fitPadding(
		container.clientWidth,
		container.clientHeight,
		insets,
		FIT_MARGIN,
	)
	return { ...padding, left: 0, right: 0 }
}

export function fitCamera(
	map: MapLibreMap,
	bounds: Bounds,
	insets: Insets,
	{ margin = FIT_MARGIN, maxZoom = MAX_FIT_ZOOM }: FrameOptions = {},
) {
	const container = map.getContainer()
	const { map: next, fit } = fitPadding(
		container.clientWidth,
		container.clientHeight,
		insets,
		margin,
	)
	const { top = 0, bottom = 0, left = 0, right = 0 } = map.getPadding()
	const vertical = (next.top + next.bottom - top - bottom) / 2
	const horizontal = -(left + right) / 2
	const camera = map.cameraForBounds(corners(bounds), {
		padding: {
			top: fit.top + vertical,
			bottom: fit.bottom + vertical,
			left: fit.left + horizontal,
			right: fit.right + horizontal,
		},
		maxZoom,
	})
	return camera && { ...camera, padding: { ...next, left: 0, right: 0 } }
}

export function loosenCameraConstraint(map: MapLibreMap) {
	map.setTransformConstrain((center, zoom) => ({
		center: new LngLat(
			center.lng,
			Math.min(
				Math.max(center.lat, -MAX_CENTER_LATITUDE),
				MAX_CENTER_LATITUDE,
			),
		),
		zoom: Math.min(Math.max(zoom, map.getMinZoom()), map.getMaxZoom()),
	}))
}

export function keepVisibleAreaOnMap(
	map: MapLibreMap,
	readOverlays: () => Overlays,
) {
	map.setTransformConstrain((center, zoom) => {
		const clamped = Math.min(
			Math.max(zoom, map.getMinZoom()),
			map.getMaxZoom(),
		)
		if (map.getProjection()?.type !== 'mercator') {
			return { center, zoom: clamped }
		}

		const { clientWidth: width, clientHeight: height } = map.getContainer()
		const { padding: insets, cover } = readOverlays()
		const padding = overlayPadding(map, insets)
		const uncovered = Math.max(height - cover.top - cover.bottom, 1)
		const fitted = Math.min(
			Math.max(clamped, Math.log2(Math.max(width, uncovered) / TILE_PX)),
			map.getMaxZoom(),
		)
		const worldPx = TILE_PX * 2 ** fitted
		const centreY = padding.top + (height - padding.top - padding.bottom) / 2
		const latitude = Math.min(Math.max(center.lat, -89), 89)
		const y = Math.min(
			Math.max(mercatorY(latitude) * worldPx, centreY - cover.top),
			worldPx - (height - cover.bottom - centreY),
		)

		return {
			center: new LngLat(center.lng, latitudeAt(y / worldPx)),
			zoom: fitted,
		}
	})
}
