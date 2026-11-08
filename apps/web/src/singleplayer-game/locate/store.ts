import type { GameState } from '@georally/game-domain/singleplayer/locate'
import { createGameStore, hasValidQuestionProgress } from '../shared/gameStore'
import { isGameConfig } from './config'

function isLocateGame(game: unknown): game is GameState {
	if (typeof game !== 'object' || game === null) {
		return false
	}

	const record = game as Record<string, unknown>
	if (!isGameConfig(record.config)) {
		return false
	}

	return (
		record.phase === 'idle' || hasValidQuestionProgress(record, record.config)
	)
}

export const locateGameStore = createGameStore(
	'georally.singleplayer.locate',
	isLocateGame,
)
