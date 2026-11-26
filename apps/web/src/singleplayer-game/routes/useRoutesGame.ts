import { playableCountryPool } from '@georally/country-catalog'
import { borderGraph } from '@georally/country-catalog/borders'
import { dailyRoutes } from '@georally/country-catalog/daily-routes'
import type { InputMethod, MatchResult } from '@georally/game-domain/answers'
import {
	createRouteBoard,
	dailyRouteSession,
	prepareRouteSession,
	reduceRouteState,
	type RouteAction,
	type RouteBoard,
	type RouteConfig,
	type RouteSession,
	type RouteState,
} from '@georally/game-domain/singleplayer/routes'
import { useCallback, useEffect, useReducer, useState } from 'react'
import type { GameStore } from '../shared/gameStore'
import { useRoutesAnalytics } from './analytics'

interface OpenedRoute {
	initial: RouteState
	session: RouteSession | null
	board: RouteBoard
}

function prepare(config: RouteConfig): RouteSession | null {
	if (config.kind === 'daily') {
		return dailyRouteSession(dailyRoutes.puzzles, config.number)
	}
	const session = prepareRouteSession(borderGraph, playableCountryPool, config)
	return session.ok ? session.value : null
}

function open(saved: RouteState): OpenedRoute | null {
	if (saved.phase === 'idle') {
		const session = prepare(saved.config)
		const board = session && createRouteBoard(borderGraph, session)
		return board ? { initial: saved, session, board } : null
	}
	const board = createRouteBoard(borderGraph, saved)
	return board ? { initial: saved, session: null, board } : null
}

function openSaved(store: GameStore<RouteState>): OpenedRoute | null {
	const saved = store.load()
	const opened = saved && open(saved)
	if (saved && !opened) {
		store.clear()
	}
	return opened
}

export function useRoutesGame(store: GameStore<RouteState>) {
	const [opened] = useState(() => openSaved(store))
	const board = opened?.board ?? null
	const session = opened?.session ?? null
	const [state, dispatch] = useReducer(
		(current: RouteState | null, action: RouteAction) =>
			current && board ? reduceRouteState(board, current, action) : current,
		opened?.initial ?? null,
	)
	const phase = state?.phase ?? null

	useEffect(() => {
		if (state) {
			store.save(state)
		}
	}, [state, store])

	useRoutesAnalytics(
		state,
		board,
		opened !== null && opened.initial.phase !== 'idle',
	)

	const begin = useCallback(() => {
		if (phase === 'idle' && session) {
			dispatch({ type: 'START', session, now: Date.now() })
		}
	}, [phase, session])

	const attempt = useCallback(
		(method: InputMethod, heard: string, results: readonly MatchResult[]) => {
			dispatch({ type: 'ATTEMPT', method, heard, results, now: Date.now() })
		},
		[],
	)

	const hint = useCallback(() => {
		dispatch({ type: 'HINT', now: Date.now() })
	}, [])

	const giveUp = useCallback(() => {
		dispatch({ type: 'GIVE_UP', now: Date.now() })
	}, [])

	return { state, board, begin, attempt, hint, giveUp }
}
