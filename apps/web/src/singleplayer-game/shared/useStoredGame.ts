import { useEffect, useLayoutEffect, useReducer, useState } from 'react'
import type { GameStore } from './gameStore'
import { recordBest, type BestResult } from './personalBests'

interface StoredGameOptions<State extends { phase: string }, Action> {
	store: GameStore<State>
	reduce: (state: State, action: Action) => State
	start: (idle: State) => State | null
	best?: (state: State) => BestResult | null
}

export function useStoredGame<State extends { phase: string }, Action>({
	store,
	reduce,
	start,
	best,
}: StoredGameOptions<State, Action>) {
	const [saved] = useState(() => store.load())
	const [state, dispatch] = useReducer(
		(current: State | null, action: Action) =>
			current && reduce(current, action),
		saved,
		initial => (initial?.phase === 'idle' ? start(initial) : initial),
	)

	useEffect(() => {
		if (state) {
			store.save(state)
		}
	}, [state, store])

	const result = state && best ? best(state) : null
	const bestKey = result?.key
	const bestValue = result?.value
	const bestAt = result?.at
	useLayoutEffect(() => {
		if (
			bestKey !== undefined &&
			bestValue !== undefined &&
			bestAt !== undefined
		) {
			recordBest({ key: bestKey, value: bestValue, at: bestAt })
		}
	}, [bestKey, bestValue, bestAt])

	return {
		state,
		dispatch,
		restored: saved !== null && saved.phase !== 'idle',
	}
}
