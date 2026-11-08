import { playableCountryPool } from '@georally/country-catalog'
import type { InputMethod, MatchResult } from '@georally/game-domain/answers'
import {
	createIdleState,
	getDeadlineAt,
	prepareGameSession,
	reduceGameState,
	type GameAction,
	type GameConfig,
	type GameSession,
	type GameState,
} from '@georally/game-domain/singleplayer/name-it'
import { useCallback, useState } from 'react'
import { useDeadline } from '@/shared/time/useDeadline'
import { useStoredGame } from '../shared/useStoredGame'
import { useNameItAnalytics } from './analytics'
import { nameItGameStore } from './store'

type NameItAction = GameAction | { type: 'RESTART' }

function reduce(state: GameState, action: NameItAction): GameState {
	return action.type === 'RESTART'
		? createIdleState(state.config)
		: reduceGameState(state, action)
}

function keepIdle(idle: GameState): GameState {
	return idle
}

function prepare(config: GameConfig): GameSession | null {
	const session = prepareGameSession(playableCountryPool, config)
	return session.ok ? session.value : null
}

export function useNameItGame() {
	const { state, dispatch, restored } = useStoredGame({
		store: nameItGameStore,
		reduce,
		start: keepIdle,
	})
	const [session, setSession] = useState(() =>
		state?.phase === 'idle' ? prepare(state.config) : null,
	)

	const engineState = state?.phase === 'idle' && !session ? null : state
	const phase = engineState?.phase ?? null
	const config = engineState?.config ?? null

	useNameItAnalytics(engineState, restored)

	useDeadline(engineState ? getDeadlineAt(engineState) : null, () =>
		dispatch({ type: 'TIME_UP', now: Date.now() }),
	)

	const upcomingTargetId =
		engineState?.phase === 'idle'
			? (session?.questionIds[0] ?? null)
			: engineState?.phase === 'revealed'
				? (engineState.questionIds[engineState.index + 1] ?? null)
				: null

	const begin = useCallback(() => {
		if (phase === 'idle' && session) {
			dispatch({ type: 'START', session, now: Date.now() })
		}
	}, [dispatch, phase, session])

	const answer = useCallback(
		(method: InputMethod, result: MatchResult) => {
			dispatch({ type: 'ATTEMPT', method, result, now: Date.now() })
		},
		[dispatch],
	)

	const giveUp = useCallback(() => {
		dispatch({ type: 'GIVE_UP', now: Date.now() })
	}, [dispatch])

	const next = useCallback(() => {
		dispatch({ type: 'NEXT', now: Date.now() })
	}, [dispatch])

	const playAgain = useCallback(() => {
		if (!config) {
			return
		}

		const nextSession = prepare(config)
		if (nextSession) {
			setSession(nextSession)
			dispatch({ type: 'RESTART' })
		}
	}, [config, dispatch])

	const leave = useCallback(() => {
		nameItGameStore.clear()
	}, [])

	return {
		engineState,
		upcomingTargetId,
		begin,
		answer,
		giveUp,
		next,
		playAgain,
		leave,
	}
}
