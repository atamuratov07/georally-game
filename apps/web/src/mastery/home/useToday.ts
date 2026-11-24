import { playableCountryPool } from '@georally/country-catalog'
import type { LocalDay } from '@georally/game-domain'
import { loadToday, type Today } from '@georally/mastery'
import { useCallback, useEffect, useState } from 'react'
import { localDay } from '@/shared/time/localDay'
import { mastery } from '../container'

export type TodayState =
	| { status: 'loading' }
	| { status: 'unavailable' }
	| { status: 'ready'; day: LocalDay; today: Today }

export function useToday() {
	const [state, setState] = useState<TodayState>({ status: 'loading' })

	const reload = useCallback(() => {
		const day = localDay(Date.now())
		return loadToday(mastery, { pool: playableCountryPool, day }).then(
			today => setState({ status: 'ready', day, today }),
			(error: unknown) => {
				console.error(error)
				setState({ status: 'unavailable' })
			},
		)
	}, [])

	useEffect(() => {
		void reload()
		const onVisible = () => {
			if (document.visibilityState === 'visible') void reload()
		}
		document.addEventListener('visibilitychange', onVisible)
		return () => document.removeEventListener('visibilitychange', onVisible)
	}, [reload])

	return [state, reload] as const
}
