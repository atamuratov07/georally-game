import type { RouteState } from '@georally/game-domain/singleplayer/routes'
import type { GameStore } from '../../shared/gameStore'
import { isRouteGame } from '../routeGame'

const KEY = 'georally.routes.daily'
const VERSION = 1
const KEPT = 400

type Entries = Map<number, RouteState>

function isEntry(number: number, game: unknown): game is RouteState {
	return (
		Number.isInteger(number) &&
		number > 0 &&
		isRouteGame(game) &&
		game.config.kind === 'daily' &&
		game.config.number === number
	)
}

export function loadDailyEntries(): ReadonlyMap<number, RouteState> {
	const entries: Entries = new Map()
	try {
		const raw = localStorage.getItem(KEY)
		const record: unknown = raw === null ? null : JSON.parse(raw)
		if (
			typeof record !== 'object' ||
			record === null ||
			(record as { version?: unknown }).version !== VERSION
		) {
			return entries
		}
		const stored = (record as { entries?: unknown }).entries
		if (typeof stored !== 'object' || stored === null) {
			return entries
		}
		for (const [key, game] of Object.entries(stored)) {
			const number = Number(key)
			if (isEntry(number, game)) entries.set(number, game)
		}
	} catch {
		return entries
	}
	return entries
}

function saveEntries(entries: Entries) {
	const kept = [...entries].sort(([a], [b]) => b - a).slice(0, KEPT)
	try {
		localStorage.setItem(
			KEY,
			JSON.stringify({
				version: VERSION,
				entries: Object.fromEntries(kept),
			}),
		)
	} catch {
		return
	}
}

function update(number: number, change: (entries: Entries) => void) {
	const entries = new Map(loadDailyEntries())
	if (entries.get(number)?.phase === 'finished') return
	change(entries)
	saveEntries(entries)
}

export function dailySlot(number: number): GameStore<RouteState> {
	return {
		load: () => loadDailyEntries().get(number) ?? null,
		save: game => update(number, entries => entries.set(number, game)),
		clear: () => update(number, entries => entries.delete(number)),
	}
}
