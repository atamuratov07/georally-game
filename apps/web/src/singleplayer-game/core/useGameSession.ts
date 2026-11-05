import {
	countryCatalog,
	playableCountryPool,
	type GameData,
} from '@georally/country-catalog'
import type { SessionPreparationError } from '@georally/game-domain'
import {
	createIdleGameState,
	prepareGameSession,
	reduceGameState,
	type GameConfig,
	type GameState,
} from '@georally/game-domain/singleplayer/locate'
import { useCallback, useEffect, useReducer, useState } from 'react'
import { useSingleplayerGameAnalytics } from '../../shared/analytics/useSingleplayerGameAnalytics'

export type GameLoadErrorCode =
	SessionPreparationError['code'] | 'no_playable_countries'

interface UseGameSessionResult {
	gameData: GameData | null
	loadErrorCode: GameLoadErrorCode | null
	engineState: GameState
	eligibleIds: string[]
	handleTryAgain: () => void
	handlePick: (countryId: string) => void
	handleGiveUp: () => void
	handleNext: () => void
}

const gameData: GameData | null =
	countryCatalog.countryIds.length > 0 ? countryCatalog : null

export function useGameSession(config: GameConfig): UseGameSessionResult {
	const [eligibleIds, setEligibleIds] = useState<string[]>([])
	const [loadErrorCode, setLoadErrorCode] = useState<GameLoadErrorCode | null>(
		gameData ? null : 'no_playable_countries',
	)

	const [engineState, dispatchEngineState] = useReducer(
		reduceGameState,
		createIdleGameState(config),
	)

	useSingleplayerGameAnalytics(engineState, config)

	const prepareAndStartGame = useCallback((nextConfig: GameConfig) => {
		if (!gameData) {
			setEligibleIds([])
			setLoadErrorCode('no_playable_countries')
			return
		}

		const result = prepareGameSession(playableCountryPool, nextConfig)
		if (!result.ok) {
			setEligibleIds([])
			setLoadErrorCode(result.error.code)
			return
		}

		setLoadErrorCode(null)
		setEligibleIds(result.value.eligibleIds)
		dispatchEngineState({
			type: 'START',
			session: result.value,
			now: Date.now(),
		})
	}, [])

	useEffect(() => {
		prepareAndStartGame(config)
	}, [config, prepareAndStartGame])

	const handleTryAgain = useCallback(() => {
		prepareAndStartGame(config)
	}, [config, prepareAndStartGame])

	const handlePick = useCallback(
		(countryId: string) => {
			if (!gameData?.countriesById.has(countryId)) {
				return
			}

			dispatchEngineState({
				type: 'PICK',
				countryId,
				now: Date.now(),
			})
		},
		[gameData],
	)

	const handleGiveUp = useCallback(() => {
		dispatchEngineState({
			type: 'GIVE_UP',
			now: Date.now(),
		})
	}, [])

	const handleNext = useCallback(() => {
		dispatchEngineState({
			type: 'NEXT',
			now: Date.now(),
		})
	}, [])

	return {
		gameData,
		loadErrorCode,
		engineState,
		eligibleIds,
		handleTryAgain,
		handlePick,
		handleGiveUp,
		handleNext,
	}
}
