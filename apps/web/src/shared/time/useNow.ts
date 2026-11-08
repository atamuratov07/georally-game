import { useEffect, useState } from 'react'

export function useNow(intervalMs: number, active: boolean): number {
	const [now, setNow] = useState(() => Date.now())

	useEffect(() => {
		if (!active) {
			return
		}

		const timer = setInterval(() => setNow(Date.now()), intervalMs)
		return () => clearInterval(timer)
	}, [active, intervalMs])

	return now
}
