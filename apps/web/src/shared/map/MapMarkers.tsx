import { Marker } from 'react-map-gl/maplibre'
import type { MapMarker } from './types'

export function MapMarkers({ markers }: { markers: readonly MapMarker[] }) {
	return markers.map(marker => (
		<Marker
			key={marker.id}
			longitude={marker.longitude}
			latitude={marker.latitude}
			anchor={marker.anchor ?? 'bottom'}
		>
			<div className='pointer-events-none'>{marker.element}</div>
		</Marker>
	))
}
