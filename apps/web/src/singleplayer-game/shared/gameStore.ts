import { playableCountryPool } from '@georally/country-catalog'
import {
	selectEligibleCountryIds,
	type GameQuestionSetConfig,
} from '@georally/game-domain'

const STORAGE_VERSION = 1
const GAME_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface SessionRecord {
	version: number
	savedAt: number
	game: unknown
}

export interface GameStore<Game> {
	load: () => Game | null
	save: (game: Game) => void
	clear: () => void
}

function isFreshRecord(record: unknown): record is SessionRecord {
	if (typeof record !== 'object' || record === null) {
		return false
	}

	const { version, savedAt } = record as Partial<SessionRecord>
	return (
		version === STORAGE_VERSION &&
		typeof savedAt === 'number' &&
		Date.now() - savedAt <= GAME_TTL_MS
	)
}

export function createGameStore<Game>(
	key: string,
	isGame: (game: unknown) => game is Game,
): GameStore<Game> {
	function clear() {
		try {
			localStorage.removeItem(key)
		} catch {
			return
		}
	}

	function load(): Game | null {
		let record: unknown
		try {
			const raw = localStorage.getItem(key)
			if (raw === null) {
				return null
			}
			record = JSON.parse(raw)
		} catch {
			record = null
		}

		if (isFreshRecord(record) && isGame(record.game)) {
			return record.game
		}

		clear()
		return null
	}

	function save(game: Game) {
		const record: SessionRecord = {
			version: STORAGE_VERSION,
			savedAt: Date.now(),
			game,
		}
		try {
			localStorage.setItem(key, JSON.stringify(record))
		} catch {
			return
		}
	}

	return { load, save, clear }
}

export function hasValidQuestionProgress(
	game: Record<string, unknown>,
	config: GameQuestionSetConfig,
): boolean {
	const { phase, questionIds, index } = game
	if (
		!Array.isArray(questionIds) ||
		questionIds.length !== config.questionCount ||
		typeof index !== 'number'
	) {
		return false
	}

	const indexInRange =
		phase === 'finished'
			? index === questionIds.length
			: (phase === 'answering' || phase === 'revealed') &&
				Number.isInteger(index) &&
				index >= 0 &&
				index < questionIds.length
	const eligibleIds = new Set(
		selectEligibleCountryIds(playableCountryPool, config),
	)

	return indexInRange && questionIds.every(id => eligibleIds.has(id))
}
