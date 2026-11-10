import { countryCatalog } from '@georally/country-catalog'
import { GAME_CONTINENTS, type GameScope } from '@georally/game-domain'
import { regionBounds } from './sprintRegion'

const wrap = (degrees: number) => ((degrees + 540) % 360) - 180

function centroidOf(countryId: string): [number, number] {
	const info = countryCatalog.countriesById.get(countryId)
	return info ? [info.centroidLng, info.centroidLat] : [0, 0]
}

function centreLongitude(scope: GameScope): number {
	const [west, , east] = regionBounds(scope)
	return wrap((west + east) / 2)
}

function orderByNearest(
	countryIds: readonly string[],
	centre: number,
): string[] {
	const left = [...countryIds].sort(
		(a, b) =>
			wrap(centroidOf(a)[0] - centre) - wrap(centroidOf(b)[0] - centre),
	)
	const ordered = left.splice(0, 1)

	while (left.length > 0) {
		const [longitude, latitude] = centroidOf(ordered[ordered.length - 1])
		let nearest = 0
		let nearestDistance = Infinity
		left.forEach((countryId, index) => {
			const [x, y] = centroidOf(countryId)
			const dx =
				wrap(x - longitude) *
				Math.cos((((latitude + y) / 2) * Math.PI) / 180)
			const distance = dx * dx + (y - latitude) ** 2
			if (distance < nearestDistance) {
				nearest = index
				nearestDistance = distance
			}
		})
		ordered.push(...left.splice(nearest, 1))
	}

	return ordered
}

export function reviewOrder(
	countryIds: readonly string[],
	scope: GameScope,
): string[] {
	if (scope !== 'all') {
		return orderByNearest(countryIds, centreLongitude(scope))
	}
	return GAME_CONTINENTS.flatMap(continent =>
		orderByNearest(
			countryIds.filter(
				countryId =>
					countryCatalog.countriesById.get(countryId)?.continent ===
					continent,
			),
			centreLongitude(continent),
		),
	)
}
