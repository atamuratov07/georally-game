import { useEffect, useRef, useState } from 'react'

export function useNearViewport<T extends Element>() {
	const ref = useRef<T>(null)
	const [near, setNear] = useState(false)

	useEffect(() => {
		const element = ref.current
		if (!element) {
			return
		}
		const observer = new IntersectionObserver(
			([entry]) => setNear(entry.isIntersecting),
			{ rootMargin: '300px 0px' },
		)
		observer.observe(element)
		return () => observer.disconnect()
	}, [])

	return { ref, near }
}
