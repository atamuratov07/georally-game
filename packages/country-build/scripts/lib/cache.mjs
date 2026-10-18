import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const helperDir = path.dirname(fileURLToPath(import.meta.url))
const defaultCacheDir = path.resolve(helperDir, '../../build/cache')

export function ensureCacheDir(cacheDir = defaultCacheDir) {
	fs.mkdirSync(cacheDir, { recursive: true })
}

function sanitizeCacheKey(cacheKey) {
	const sanitized = String(cacheKey ?? '')
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, '-')
		.replace(/^-+|-+$/g, '')

	if (!sanitized) {
		throw new Error('WDQS cache key must contain at least one safe character')
	}

	return sanitized
}

export function buildCachePath(cacheDir = defaultCacheDir, cacheKey) {
	return path.join(cacheDir, `${sanitizeCacheKey(cacheKey)}.json`)
}

export function readCachedJson(cachePath) {
	if (!fs.existsSync(cachePath)) {
		return null
	}

	return JSON.parse(fs.readFileSync(cachePath, 'utf8'))
}

export function writeCachedJson(cachePath, value) {
	fs.writeFileSync(cachePath, JSON.stringify(value, null, 2), 'utf8')
}

export function isRefreshRequested() {
	return process.env.COUNTRY_BUILD_REFRESH === '1'
}

export function readCachedResponse(cachePath, source, cacheKey) {
	if (isRefreshRequested()) {
		return null
	}

	const cached = readCachedJson(cachePath)
	if (cached !== null) {
		console.log(
			`${source} "${cacheKey}": using the cached response at ${cachePath}. Set COUNTRY_BUILD_REFRESH=1 to request it again.`,
		)
	}
	return cached
}
