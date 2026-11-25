import {
	loadMastery,
	skillLayer,
	type IntroPlan,
	type MasteryLayer,
} from '@georally/mastery'
import { useEffect, useState } from 'react'
import { mastery } from '../container'

export type MasteryLayerState =
	| { status: 'loading' }
	| { status: 'failed' }
	| {
			status: 'ready'
			layer: MasteryLayer
			plan: IntroPlan | null
			now: number
	  }

export function useMasteryLayer(): MasteryLayerState {
	const [state, setState] = useState<MasteryLayerState>({ status: 'loading' })

	useEffect(() => {
		let ignore = false
		const now = Date.now()
		loadMastery(mastery, now).then(
			({ views, plan }) => {
				if (!ignore)
					setState({
						status: 'ready',
						layer: skillLayer(views, 'locate'),
						plan,
						now,
					})
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
