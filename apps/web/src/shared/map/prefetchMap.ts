import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

const MAP_ASSET_URLS = [
	workerUrl,
	'/map/style.json',
	'/map/archipelagos.geojson',
]
const TILE_JSON_URL = '/map/tiles/tiles.json'
const PREFETCH_MAX_ZOOM = 2

let started = false

function warm(url: string): Promise<Response | undefined> {
	return fetch(url, { priority: 'low' }).catch(() => undefined)
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

async function warmTiles(): Promise<void> {
	const response = await warm(TILE_JSON_URL)
	if (!response?.ok) {
		return
	}

	const tileJson = (await response.json().catch(() => null)) as {
		tiles?: string[]
	} | null
	const template = tileJson?.tiles?.[0]
	if (template) {
		tileUrls(template).forEach(url => void warm(url))
	}
}

export function prefetchMap(): void {
	if (started) {
		return
	}
	started = true

	MAP_ASSET_URLS.forEach(url => void warm(url))
	void warmTiles()
}
