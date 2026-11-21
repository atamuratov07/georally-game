import { countryCatalog } from '@georally/country-catalog'
import type { Bounds } from '@/shared/map/camera/framing'

const HALF_SPAN = { longitude: 30, latitude: 15 }
export const NEAR_CENTRE = { longitude: 6, latitude: 4 }

export function routeFrame(
	countryIds: readonly string[],
	halfSpan = HALF_SPAN,
): Bounds | null {
	const boxes = countryIds.flatMap(countryId => {
		const info = countryCatalog.countriesById.get(countryId)
		if (!info) {
			return []
		}
		const [west, south, east, north] = info.bounds
		const { centroidLng: lng, centroidLat: lat } = info
		return [
			[
				Math.max(west, lng - halfSpan.longitude),
				Math.max(south, lat - halfSpan.latitude),
				Math.min(east, lng + halfSpan.longitude),
				Math.min(north, lat + halfSpan.latitude),
			] as const,
		]
	})
	if (boxes.length === 0) {
		return null
	}
	return [
		Math.min(...boxes.map(box => box[0])),
		Math.min(...boxes.map(box => box[1])),
		Math.max(...boxes.map(box => box[2])),
		Math.max(...boxes.map(box => box[3])),
	]
}

export function joinFrames(
	...frames: readonly (Bounds | null)[]
): Bounds | null {
	const all = frames.filter(frame => frame !== null)
	if (all.length === 0) {
		return null
	}
	return [
		Math.min(...all.map(frame => frame[0])),
		Math.min(...all.map(frame => frame[1])),
		Math.max(...all.map(frame => frame[2])),
		Math.max(...all.map(frame => frame[3])),
	]
}
