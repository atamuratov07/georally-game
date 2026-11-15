import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import archipelagosUrl from './generated/archipelagos.geojson?url'
import tileJson from './generated/tiles.json'

const MAP_ASSET_URLS = [workerUrl, archipelagosUrl]
const PREFETCH_MAX_ZOOM = 2

let started = false

function warm(url: string): void {
	void fetch(url, { priority: 'low' }).catch(() => undefined)
}

function tileUrls(template: string): string[] {
	const urls: string[] = []
	for (let z = 0; z <= PREFETCH_MAX_ZOOM; z++) {
		const size = 2 ** z
		for (let x = 0; x < size; x++) {
			for (let y = 0; y < size; y++) {
				urls.push(
					template
						.replace('{z}', String(z))
						.replace('{x}', String(x))
						.replace('{y}', String(y)),
				)
			}
		}
	}
	return urls
}

export function prefetchMap(): void {
	if (started) {
		return
	}
	started = true

	MAP_ASSET_URLS.forEach(warm)
	tileUrls(tileJson.tiles[0]).forEach(warm)
}
