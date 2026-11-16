import {
	createHandlerBoundToURL,
	precacheAndRoute,
	cleanupOutdatedCaches,
	type PrecacheEntry,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import tileJson from '../src/shared/map/generated/tiles.json'

declare const self: ServiceWorkerGlobalScope & {
	__WB_MANIFEST: Array<PrecacheEntry | string>
}

const manifest = self.__WB_MANIFEST

const TILE_CACHE_PREFIX = 'map-tiles-'
const tilesVersion =
	new URL(tileJson.tiles[0], self.location.origin).searchParams.get('v') ?? ''
const tileCacheName = `${TILE_CACHE_PREFIX}${tilesVersion}`

const localeShells = new Map(
	manifest
		.map(entry => (typeof entry === 'string' ? entry : entry.url))
		.flatMap(url => {
			const match = /^\/?locales\/([^/]+)\.html$/.exec(url)
			return match ? [[match[1], `/locales/${match[1]}.html`] as const] : []
		}),
)

precacheAndRoute(manifest, { ignoreURLParametersMatching: [/^v$/] })
cleanupOutdatedCaches()

const mainShell = createHandlerBoundToURL('/index.html')
const localeHandlers = new Map(
	[...localeShells].map(([segment, url]) => [
		segment,
		createHandlerBoundToURL(url),
	]),
)

registerRoute(
	new NavigationRoute(
		options => {
			const segment = new URL(options.request.url).pathname.split('/')[1]
			return (localeHandlers.get(segment) ?? mainShell)(options)
		},
		{ denylist: [/^\/api\//, /^\/socket\.io\//, /^\/health$/, /\/[^/]+\.[^/]+$/] },
	),
)

registerRoute(
	({ url }) => url.pathname.startsWith('/map/tiles/'),
	new CacheFirst({ cacheName: tileCacheName }),
)

registerRoute(
	({ url }) => url.pathname.startsWith('/map/fonts/'),
	new CacheFirst({ cacheName: 'map-fonts' }),
)

self.addEventListener('message', event => {
	if (event.data?.type === 'SKIP_WAITING') {
		void self.skipWaiting()
	}
})

self.addEventListener('activate', event => {
	event.waitUntil(
		(async () => {
			const names = await caches.keys()
			await Promise.all(
				names
					.filter(
						name =>
							name.startsWith(TILE_CACHE_PREFIX) && name !== tileCacheName,
					)
					.map(name => caches.delete(name)),
			)
			await self.clients.claim()
		})(),
	)
})
