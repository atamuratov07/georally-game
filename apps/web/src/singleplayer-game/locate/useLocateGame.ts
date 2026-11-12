import { countryCatalog, playableCountryPool } from '@georally/country-catalog'
import { selectEligibleCountryIds } from '@georally/game-domain'
import {
	prepareGameSession,
	reduceGameState,
	type GameConfig,
	type GameSession,
	type GameState,
} from '@georally/game-domain/singleplayer/locate'
import { useCallback, useMemo, useState } from 'react'
import { useStoredGame } from '../shared/useStoredGame'
import { useLocateGameAnalytics } from './analytics'
import { locateGameStore } from './store'

interface UseLocateGameResult {
	engineState: GameState | null
	eligibleIds: string[]
	upcomingTargetId: string | null
	begin: (startsAt: number) => void
	handlePick: (countryId: string) => void
	handleGiveUp: () => void
	handleNext: (startsAt: number) => void
	handlePlayAgain: () => void
	handleLeave: () => void
}

function keepIdle(idle: GameState): GameState {
	return idle
}

function prepare(config: GameConfig): GameSession | null {
	const session = prepareGameSession(playableCountryPool, config)
	return session.ok ? session.value : null
}

export function useLocateGame(): UseLocateGameResult {
	const { state, dispatch, restored } = useStoredGame({
		store: locateGameStore,
		reduce: reduceGameState,
		start: keepIdle,
	})
	const [session] = useState(() =>
		state?.phase === 'idle' ? prepare(state.config) : null,
	)
	const engineState = state?.phase === 'idle' && !session ? null : state
	const phase = engineState?.phase ?? null
	const config = engineState?.config
	const upcomingTargetId =
		phase === 'idle' ? (session?.questionIds[0] ?? null) : null

	const eligibleIds = useMemo(
		() =>
			config ? selectEligibleCountryIds(playableCountryPool, config) : [],
		[config],
	)

	useLocateGameAnalytics(engineState, restored)

	const begin = useCallback(
		(startsAt: number) => {
			if (phase === 'idle' && session) {
				dispatch({ type: 'START', session, now: startsAt })
			}
		},
		[dispatch, phase, session],
	)

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

	const handleNext = useCallback(
		(startsAt: number) => {
			dispatch({ type: 'NEXT', now: startsAt })
		},
		[dispatch],
	)

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
		upcomingTargetId,
		begin,
		handlePick,
		handleGiveUp,
		handleNext,
		handlePlayAgain,
		handleLeave,
	}
}
