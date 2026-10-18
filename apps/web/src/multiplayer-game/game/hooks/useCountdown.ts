import { useEffect, useState } from 'react'

import { getServerNow } from '../../model/serverClock'

export function useCountdown(deadlineAt: number | null): number {
	const [now, setNow] = useState(() => getServerNow())

	useEffect(() => {
		if (!deadlineAt) {
			return
		}

		setNow(getServerNow())
		const intervalId = setInterval(() => {
			setNow(getServerNow())
		}, 1000)

		return () => {
			clearInterval(intervalId)
		}
	}, [deadlineAt])

	if (!deadlineAt) {
		return 0
	}

	return Math.max(0, Math.ceil((deadlineAt - now) / 1000))
}
