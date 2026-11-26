import { loadMastery, type MasteryState } from '@georally/mastery'
import { useEffect, useState } from 'react'
import { mastery } from '../container'

export type MasteryPageState =
	| { status: 'loading' }
	| { status: 'failed' }
	| ({ status: 'ready'; now: number } & MasteryState)

export function useMasteryState(): MasteryPageState {
	const [state, setState] = useState<MasteryPageState>({ status: 'loading' })

	useEffect(() => {
		let ignore = false
		const now = Date.now()
		loadMastery(mastery, now).then(
			loaded => {
				if (!ignore) setState({ status: 'ready', now, ...loaded })
			},
			(error: unknown) => {
				console.error(error)
				if (!ignore) setState({ status: 'failed' })
			},
		)
		return () => {
			ignore = true
		}
	}, [])

	return state
}
