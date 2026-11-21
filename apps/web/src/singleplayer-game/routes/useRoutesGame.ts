import { playableCountryPool } from '@georally/country-catalog'
import { borderGraph } from '@georally/country-catalog/borders'
import type { InputMethod, MatchResult } from '@georally/game-domain/answers'
import {
	createRouteBoard,
	prepareRouteSession,
	reduceRouteState,
	type RouteAction,
	type RouteBoard,
	type RouteConfig,
	type RouteSession,
	type RouteState,
} from '@georally/game-domain/singleplayer/routes'
import { useCallback, useEffect, useReducer, useState } from 'react'
import { useRoutesAnalytics } from './analytics'
import { routeGameStore } from './store'

interface OpenedRoute {
	initial: RouteState
	session: RouteSession | null
	board: RouteBoard
}

function prepare(config: RouteConfig): RouteSession | null {
	if (config.kind !== 'practice') {
		return null
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

function openSaved(): OpenedRoute | null {
	const saved = routeGameStore.load()
	const opened = saved && open(saved)
	if (saved && !opened) {
		routeGameStore.clear()
	}
	return opened
}

export function useRoutesGame() {
	const [opened] = useState(openSaved)
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
			routeGameStore.save(state)
		}
	}, [state])

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

	const leave = useCallback(() => {
		routeGameStore.clear()
	}, [])

	return { state, board, begin, attempt, hint, giveUp, leave }
}
