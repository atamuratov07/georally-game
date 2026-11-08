import { useEffect, useReducer, useState } from 'react'
import type { GameStore } from './gameStore'

interface StoredGameOptions<State extends { phase: string }, Action> {
	store: GameStore<State>
	reduce: (state: State, action: Action) => State
	start: (idle: State) => State | null
}

export function useStoredGame<State extends { phase: string }, Action>({
	store,
	reduce,
	start,
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

	return {
		state,
		dispatch,
		restored: saved !== null && saved.phase !== 'idle',
	}
}
