import type { Map as MapLibreMap } from 'maplibre-gl'

const SIZE = 20
const STRIPE_WIDTH = 4

export type Rgba = readonly [number, number, number, number]

export interface Hatch {
	stripe: Rgba
	ground?: Rgba
}

function hatch({ stripe, ground }: Hatch) {
	const data = new Uint8Array(SIZE * SIZE * 4)
	for (let y = 0; y < SIZE; y++) {
		for (let x = 0; x < SIZE; x++) {
			const color = (x + y) % SIZE < STRIPE_WIDTH ? stripe : ground
			if (color) data.set(color, (y * SIZE + x) * 4)
		}
	}
	return { width: SIZE, height: SIZE, data }
}

/** Diagonal stripes, over a transparent or solid ground. */
export function addHatchPattern(map: MapLibreMap, id: string, colors: Hatch) {
	if (!map.hasImage(id)) {
		map.addImage(id, hatch(colors), { pixelRatio: 2 })
	}
}
