import { useEffect, useRef } from 'react'

export function useDeadline(at: number | null, onExpire: () => void): void {
	const onExpireRef = useRef(onExpire)

	useEffect(() => {
		onExpireRef.current = onExpire
	})

	useEffect(() => {
		if (at === null) {
			return
		}

		const timer = setTimeout(
			() => onExpireRef.current(),
			Math.max(0, at - Date.now()),
		)
		return () => clearTimeout(timer)
	}, [at])
}
