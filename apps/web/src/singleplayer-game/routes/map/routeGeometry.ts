import { countryCatalog } from '@georally/country-catalog'
import type { BorderLink } from '@georally/game-domain/borders'
import borderCrossings from '@/shared/map/generated/border-crossings.json'

export type Point = readonly [longitude: number, latitude: number]

const EARTH_RADIUS_KM = 6371
const DEGREE = Math.PI / 180

const crossings: ReadonlyMap<string, Point> = new Map(
	Object.entries(borderCrossings).map(([id, [lng, lat]]) => [id, [lng, lat]]),
)

function linkKey(a: string, b: string): string {
	return a < b ? `${a}-${b}` : `${b}-${a}`
}

export function centroidOf(countryId: string): Point | null {
	const info = countryCatalog.countriesById.get(countryId)
	return info ? [info.centroidLng, info.centroidLat] : null
}

type Vector = readonly [number, number, number]

function toVector([longitude, latitude]: Point): Vector {
	const lng = longitude * DEGREE
	const lat = latitude * DEGREE
	return [
		Math.cos(lat) * Math.cos(lng),
		Math.cos(lat) * Math.sin(lng),
		Math.sin(lat),
	]
}

function toPoint([x, y, z]: Vector): Point {
	return [Math.atan2(y, x) / DEGREE, Math.atan2(z, Math.hypot(x, y)) / DEGREE]
}

function angleBetween(p: Vector, q: Vector): number {
	return Math.acos(
		Math.min(1, Math.max(-1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2])),
	)
}

function arc(a: Point, b: Point): Point[] {
	const p = toVector(a)
	const q = toVector(b)
	const angle = angleBetween(p, q)
	const steps = Math.max(1, Math.ceil(angle / DEGREE))
	if (angle < 1e-9) {
		return [a, b]
	}
	const points: Point[] = []
	for (let i = 0; i <= steps; i++) {
		const t = i / steps
		const wa = Math.sin((1 - t) * angle) / Math.sin(angle)
		const wb = Math.sin(t * angle) / Math.sin(angle)
		const point = toPoint([
			wa * p[0] + wb * q[0],
			wa * p[1] + wb * q[1],
			wa * p[2] + wb * q[2],
		])
		const previous = points.at(-1)
		const turns = previous ? Math.round((previous[0] - point[0]) / 360) : 0
		points.push([point[0] + turns * 360, point[1]])
	}
	return points
}

export function linkPath([from, to]: BorderLink): Point[] | null {
	const a = centroidOf(from)
	const b = centroidOf(to)
	if (!a || !b) {
		return null
	}
	const crossing = crossings.get(linkKey(from, to)) ?? [
		(a[0] + b[0]) / 2,
		(a[1] + b[1]) / 2,
	]
	return [...arc(a, crossing), ...arc(crossing, b).slice(1)]
}

export function joinPaths(paths: readonly (readonly Point[])[]): Point[] {
	return paths.flatMap((path, i) => (i === 0 ? path : path.slice(1)))
}

export function segmentKm(path: readonly Point[]): number[] {
	return path
		.slice(1)
		.map(
			(point, i) =>
				angleBetween(toVector(path[i]), toVector(point)) * EARTH_RADIUS_KM,
		)
}

export function pathKm(path: readonly Point[]): number {
	return segmentKm(path).reduce((sum, km) => sum + km, 0)
}

export function partialPath(path: readonly Point[], progress: number): Point[] {
	if (progress >= 1 || path.length < 2) {
		return [...path]
	}
	const lengths = segmentKm(path)
	let left = lengths.reduce((sum, km) => sum + km, 0) * Math.max(0, progress)
	const out: Point[] = [path[0]]
	for (let i = 0; i < lengths.length; i++) {
		const [ax, ay] = path[i]
		const [bx, by] = path[i + 1]
		if (left >= lengths[i]) {
			out.push(path[i + 1])
			left -= lengths[i]
			continue
		}
		const t = lengths[i] === 0 ? 0 : left / lengths[i]
		out.push([ax + (bx - ax) * t, ay + (by - ay) * t])
		break
	}
	return out
}

export function pointAlong(path: readonly Point[], progress: number): Point {
	const partial = partialPath(path, progress)
	return partial[partial.length - 1]
}
