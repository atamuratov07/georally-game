import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { polygon } from '@turf/helpers'

const MAX_GAP_DEGREES = 2

function unwrap(lon, reference) {
	return lon + 360 * Math.round((reference - lon) / 360)
}

function pointBox(lon, lat) {
	return [lon, lat, lon, lat]
}

function extend(a, b) {
	return [
		Math.min(a[0], b[0]),
		Math.min(a[1], b[1]),
		Math.max(a[2], b[2]),
		Math.max(a[3], b[3]),
	]
}

function gapBetween(a, b) {
	return Math.max(0, a[0] - b[2], b[0] - a[2], a[1] - b[3], b[1] - a[3])
}

function partBox(rings, reference) {
	let box = null
	for (const [lon, lat] of rings[0]) {
		const point = pointBox(unwrap(lon, reference), lat)
		box = box ? extend(box, point) : point
	}
	return box
}

function anchorPartIndex(parts, boxes, anchor, anchorBox) {
	const inside = parts.findIndex(rings =>
		booleanPointInPolygon(anchor, polygon(rings)),
	)
	if (inside >= 0) {
		return inside
	}

	let nearest = 0
	for (let index = 1; index < boxes.length; index++) {
		if (
			gapBetween(boxes[index], anchorBox) <
			gapBetween(boxes[nearest], anchorBox)
		) {
			nearest = index
		}
	}
	return nearest
}

export function mainBounds(geometry, anchors) {
	const reference = anchors[0][0]
	const parts =
		geometry.type === 'Polygon'
			? [geometry.coordinates]
			: geometry.coordinates
	const boxes = parts.map(rings => partBox(rings, reference))

	const used = new Set()
	let box = null
	for (const anchor of anchors) {
		const anchorBox = pointBox(unwrap(anchor[0], reference), anchor[1])
		const index = anchorPartIndex(parts, boxes, anchor, anchorBox)
		used.add(index)
		box = extend(box ? extend(box, anchorBox) : anchorBox, boxes[index])
	}

	let grew = true
	while (grew) {
		grew = false
		boxes.forEach((partBounds, index) => {
			if (
				!used.has(index) &&
				gapBetween(box, partBounds) <= MAX_GAP_DEGREES
			) {
				used.add(index)
				box = extend(box, partBounds)
				grew = true
			}
		})
	}

	const shift = -360 * Math.floor((box[0] + 180) / 360)
	return [
		Math.floor((box[0] + shift) * 1e4) / 1e4,
		Math.floor(box[1] * 1e4) / 1e4,
		Math.ceil((box[2] + shift) * 1e4) / 1e4,
		Math.ceil(box[3] * 1e4) / 1e4,
	]
}

export function boundsProblem(bounds) {
	const [west, south, east, north] = bounds
	if (!bounds.every(Number.isFinite)) return 'bounds are not finite'
	if (west < -180 || west >= 180)
		return `bounds west ${west} is outside [-180, 180)`
	if (east < west || east - west >= 360)
		return `bounds east ${east} is out of order`
	if (south < -90 || north > 90 || north < south)
		return `bounds latitudes ${south}..${north} are out of order`
	return null
}
