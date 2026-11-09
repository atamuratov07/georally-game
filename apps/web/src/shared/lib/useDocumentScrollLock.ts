import { useEffect } from 'react'

export function useDocumentScrollLock(): void {
	useEffect(() => {
		const { style } = document.documentElement
		const previous = {
			overflow: style.overflow,
			overscrollBehavior: style.overscrollBehavior,
		}
		style.overflow = 'hidden'
		style.overscrollBehavior = 'none'

		return () => {
			style.overflow = previous.overflow
			style.overscrollBehavior = previous.overscrollBehavior
		}
	}, [])
}
