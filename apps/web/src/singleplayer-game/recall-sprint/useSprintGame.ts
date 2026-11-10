import { playableCountryPool } from '@georally/country-catalog'
import type { InputMethod, MatchResult } from '@georally/game-domain/answers'
import {
	getDeadlineAt,
	prepareSprintSession,
	reduceSprintState,
	type SprintConfig,
	type SprintState,
} from '@georally/game-domain/singleplayer/recall-sprint'
import { useCallback, useState } from 'react'
import { useDeadline } from '@/shared/time/useDeadline'
import { useStoredGame } from '../shared/useStoredGame'
import { useSprintAnalytics } from './analytics'
import { sprintGameStore } from './store'

function keepIdle(idle: SprintState): SprintState {
	return idle
}

function prepare(config: SprintConfig) {
	const session = prepareSprintSession(playableCountryPool, config)
	return session.ok ? session.value : null
}

export function useSprintGame() {
	const { state, dispatch, restored } = useStoredGame({
		store: sprintGameStore,
		reduce: reduceSprintState,
		start: keepIdle,
	})
	const [session] = useState(() =>
		state?.phase === 'idle' ? prepare(state.config) : null,
	)
	const engineState = state?.phase === 'idle' && !session ? null : state
	const phase = engineState?.phase ?? null

	useSprintAnalytics(engineState, restored)

	useDeadline(engineState ? getDeadlineAt(engineState) : null, () =>
		dispatch({ type: 'TIME_UP', now: Date.now() }),
	)

	const begin = useCallback(() => {
		if (phase === 'idle' && session) {
			dispatch({ type: 'START', session, now: Date.now() })
		}
	}, [dispatch, phase, session])

	const attempt = useCallback(
		(method: InputMethod, heard: string, results: readonly MatchResult[]) => {
			dispatch({ type: 'ATTEMPT', method, heard, results, now: Date.now() })
		},
		[dispatch],
	)

	const finish = useCallback(() => {
		dispatch({ type: 'FINISH', now: Date.now() })
	}, [dispatch])

	const leave = useCallback(() => {
		sprintGameStore.clear()
	}, [])

	return { engineState, begin, attempt, finish, leave }
}
