import { countryCatalog, playableCountryPool } from '@georally/country-catalog'
import { selectEligibleCountryIds } from '@georally/game-domain'
import {
	prepareGameSession,
	reduceGameState,
	type GameState,
} from '@georally/game-domain/singleplayer/locate'
import { useCallback, useMemo } from 'react'
import { useStoredGame } from '../shared/useStoredGame'
import { useLocateGameAnalytics } from './analytics'
import { locateGameStore } from './store'

interface UseLocateGameResult {
	engineState: GameState | null
	eligibleIds: string[]
	handlePick: (countryId: string) => void
	handleGiveUp: () => void
	handleNext: () => void
	handlePlayAgain: () => void
	handleLeave: () => void
}

function start(idle: GameState): GameState | null {
	const session = prepareGameSession(playableCountryPool, idle.config)
	return session.ok
		? reduceGameState(idle, {
				type: 'START',
				session: session.value,
				now: Date.now(),
			})
		: null
}

export function useLocateGame(): UseLocateGameResult {
	const {
		state: engineState,
		dispatch,
		restored,
	} = useStoredGame({ store: locateGameStore, reduce: reduceGameState, start })
	const config = engineState?.config

	const eligibleIds = useMemo(
		() =>
			config ? selectEligibleCountryIds(playableCountryPool, config) : [],
		[config],
	)

	useLocateGameAnalytics(engineState, restored)

	const handlePick = useCallback(
		(countryId: string) => {
			if (!countryCatalog.countriesById.has(countryId)) {
				return
			}

			dispatch({ type: 'PICK', countryId, now: Date.now() })
		},
		[dispatch],
	)

	const handleGiveUp = useCallback(() => {
		dispatch({ type: 'GIVE_UP', now: Date.now() })
	}, [dispatch])

	const handleNext = useCallback(() => {
		dispatch({ type: 'NEXT', now: Date.now() })
	}, [dispatch])

	const handlePlayAgain = useCallback(() => {
		if (!config) {
			return
		}

		const session = prepareGameSession(playableCountryPool, config)
		if (session.ok) {
			dispatch({ type: 'START', session: session.value, now: Date.now() })
		}
	}, [config, dispatch])

	const handleLeave = useCallback(() => {
		locateGameStore.clear()
	}, [])

	return {
		engineState,
		eligibleIds,
		handlePick,
		handleGiveUp,
		handleNext,
		handlePlayAgain,
		handleLeave,
	}
}
