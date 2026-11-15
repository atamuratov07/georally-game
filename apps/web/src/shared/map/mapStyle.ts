import type { StyleSpecification } from 'maplibre-gl'
import archipelagosUrl from './generated/archipelagos.geojson?url'
import tileJson from './generated/tiles.json'
import { GLYPHS_URL } from './map-styles'
import style from './style.json'

const { tiles, minzoom, maxzoom, bounds, attribution } = tileJson

export const MAP_STYLE = {
	...style,
	glyphs: GLYPHS_URL,
	sources: {
		...style.sources,
		world: {
			...style.sources.world,
			tiles,
			minzoom,
			maxzoom,
			bounds,
			attribution,
		},
		archipelagos: { ...style.sources.archipelagos, data: archipelagosUrl },
	},
} as unknown as StyleSpecification
