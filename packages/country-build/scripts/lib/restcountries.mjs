import {
	buildCachePath,
	ensureCacheDir,
	readCachedJson,
	readCachedResponse,
	writeCachedJson,
} from './cache.mjs'

const RESTCOUNTRIES_BASE = 'https://api.restcountries.com/countries/v5'
const PAGE_LIMIT = 100

function requireApiKey() {
	const key = process.env.RESTCOUNTRIES_API_KEY
	if (!key) {
		throw new Error('RESTCOUNTRIES_API_KEY is not set.')
	}
	return key
}

function formatFailureMessage({ status, statusText, cachePath }) {
	const statusPart = statusText ? `${status} ${statusText}` : String(status)
	return [
		`Restcountries request failed with HTTP ${statusPart}.`,
		`No cached response exists at ${cachePath}.`,
		'The first successful online run is required to seed the local Restcountries cache.',
	].join(' ')
}

export async function fetchRestcountriesJson({ fields, cacheKey, cacheDir }) {
	ensureCacheDir(cacheDir)

	const cachePath = buildCachePath(cacheDir, cacheKey)
	const cachedResponse = readCachedResponse(
		cachePath,
		'Restcountries',
		cacheKey,
	)
	if (cachedResponse !== null) {
		return cachedResponse
	}

	const result = []
	const apiKey = requireApiKey()
	let lastFailure = null
	let more = true,
		offset = 0

	while (more) {
		const url = new URL(RESTCOUNTRIES_BASE)
		url.searchParams.append('response_fields', fields.join(','))
		url.searchParams.append('limit', String(PAGE_LIMIT))
		url.searchParams.append('offset', String(offset))
		try {
			const response = await fetch(url.toString(), {
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
			})
			if (response.ok) {
				let payload
				try {
					payload = await response.json()
				} catch (error) {
					throw new Error(
						`Restcountries returned an invalid JSON body for cache key "${cacheKey}": ${error instanceof Error ? error.message : String(error)}`,
					)
				}

				if (!payload || typeof payload !== 'object') {
					throw new Error(
						`Restcountries returned an empty or non-object JSON payload for cache key "${cacheKey}".`,
					)
				}

				const objects = payload?.data?.objects
				if (!Array.isArray(objects)) {
					throw new Error(
						`REST Countries returned an unexpected response shape for ${url}. Expected data.objects to be an array, got: ${JSON.stringify(payload).slice(0, 200)}`,
					)
				}

				result.push(...objects)
				more = payload?.data?.meta?.more
				offset += PAGE_LIMIT
				continue
			}

			lastFailure = {
				status: response.status,
				statusText: response.statusText,
			}

			if (response.status === 429) {
				console.warn(
					`Restcountries throttled request "${cacheKey}" with HTTP 429.`,
				)
			}
			break
		} catch (error) {
			lastFailure = {
				status: 'network-error',
				statusText:
					error instanceof Error && error.message
						? error.message
						: String(error),
			}
			break
		}
	}

	if (!lastFailure && result) {
		writeCachedJson(cachePath, result)
		return result
	}

	const cached = readCachedJson(cachePath)
	if (cached !== null) {
		const statusPart = lastFailure
			? `${lastFailure.status}${lastFailure.statusText ? ` ${lastFailure.statusText}` : ''}`
			: 'Unknown error'

		console.warn(
			`Restcountries request "${cacheKey}" failed (${statusPart}). Falling back to cached response at ${cachePath}.`,
		)
		return cached
	}

	if (!lastFailure) {
		throw new Error(
			`Restcountries request "${cacheKey}" failed before any response was recorded. No cached response exists at ${cachePath}. The first successful online run is required to seed the local WDQS cache.`,
		)
	}

	if (typeof lastFailure.status === 'number') {
		throw new Error(
			formatFailureMessage({
				status: lastFailure.status,
				statusText: lastFailure.statusText,
				cachePath,
			}),
		)
	}

	throw new Error(
		`Restcountries request "${cacheKey}" failed (${lastFailure.statusText}). No cached response exists at ${cachePath}. The first successful online run is required to seed the local WDQS cache.`,
	)
}

export function pickPrimaryCapital(rest) {
	const capitals = Array.isArray(rest?.capitals) ? rest.capitals : []
	if (capitals.length === 0) return null
	return capitals.find(c => c?.attributes?.primary === true) ?? capitals[0]
}

export function extractCapitalCoords(capital) {
	const coords = capital?.coordinates
	if (!coords || Array.isArray(coords)) return null
	const lat = Number(coords.lat)
	const lng = Number(coords.lng)
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
	return [lng, lat]
}

export function pickPrimaryCurrency(currencies) {
	const list = Array.isArray(currencies) ? currencies : []
	if (!list.length) return null

	const sorted = [...list].sort((a, b) =>
		String(a?.code ?? '').localeCompare(String(b?.code ?? '')),
	)
	const primary = sorted[0]

	return {
		code: primary?.code ?? '',
		name: primary?.name ?? '',
		symbol: primary?.symbol ?? '',
	}
}
