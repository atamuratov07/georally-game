import { HitRing } from '@/shared/map/HitRing'
import { MapMarkers } from '@/shared/map/MapMarkers'
import type { MapMarker } from '@/shared/map/types'
import { centroidOf } from './routeGeometry'
import type { Ring } from './useRouteRings'

export function RouteRings({
	rings,
	onDone,
}: {
	rings: readonly Ring[]
	onDone: (key: string) => void
}) {
	const markers: MapMarker[] = rings.flatMap(ring => {
		const point = centroidOf(ring.countryId)
		return point
			? [
					{
						id: ring.key,
						longitude: point[0],
						latitude: point[1],
						anchor: 'center',
						element: (
							<HitRing
								className={ring.className}
								delay={ring.delay}
								onDone={() => onDone(ring.key)}
							/>
						),
					},
				]
			: []
	})

	return <MapMarkers markers={markers} />
}
