import { useMemo, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'georally.singleplayer.bests'
const STORAGE_VERSION = 1

interface StoredBest {
	value: number
	at: number
	previous: number | null
}

export interface BestResult {
	key: string
	value: number
	at: number
}

export interface BestView {
	best: number
	previous: number | null
	setNow: boolean
}

const listeners = new Set<() => void>()

function isStoredBest(value: unknown): value is StoredBest {
	if (typeof value !== 'object' || value === null) return false
	const best = value as Record<keyof StoredBest, unknown>
	return (
		Number.isFinite(best.value) &&
		Number.isFinite(best.at) &&
		(best.previous === null || Number.isFinite(best.previous))
	)
}

function readRaw(): string | null {
	try {
		return window.localStorage.getItem(STORAGE_KEY)
	} catch {
		return null
	}
}

function parseEntries(raw: string | null): Record<string, StoredBest> {
	try {
		const record: unknown = raw === null ? null : JSON.parse(raw)
		if (
			typeof record !== 'object' ||
			record === null ||
			(record as { version?: unknown }).version !== STORAGE_VERSION
		) {
			return {}
		}
		const entries = (record as { entries?: unknown }).entries
		if (typeof entries !== 'object' || entries === null) return {}
		return Object.fromEntries(
			Object.entries(entries).filter(([, best]) => isStoredBest(best)),
		) as Record<string, StoredBest>
	} catch {
		return {}
	}
}

function subscribe(listener: () => void): () => void {
	listeners.add(listener)
	window.addEventListener('storage', listener)
	return () => {
		listeners.delete(listener)
		window.removeEventListener('storage', listener)
	}
}

export function regionsKey(regions: readonly string[]): string {
	return regions.length === 0 ? 'all' : regions.join('+')
}

export function recordBest({ key, value, at }: BestResult): void {
	const entries = parseEntries(readRaw())
	const stored = entries[key]
	if (stored?.at === at || value <= 0 || (stored && value <= stored.value)) {
		return
	}
	try {
		window.localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				version: STORAGE_VERSION,
				entries: {
					...entries,
					[key]: { value, at, previous: stored?.value ?? null },
				},
			}),
		)
	} catch {
		return
	}
	listeners.forEach(listener => listener())
}

function useStoredBest(key: string): StoredBest | null {
	const raw = useSyncExternalStore(subscribe, readRaw, () => null)
	return useMemo(() => parseEntries(raw)[key] ?? null, [raw, key])
}

export function useBestValue(key: string): number | null {
	return useStoredBest(key)?.value ?? null
}

/** `at` is the finished game's time: a best that game set carries the same one. */
export function useBestView(key: string, at: number | null): BestView | null {
	const stored = useStoredBest(key)
	if (!stored || at === null) return null
	return stored.at === at
		? { best: stored.value, previous: stored.previous, setNow: true }
		: { best: stored.value, previous: null, setNow: false }
}
