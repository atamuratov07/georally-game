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

		const viewport = window.visualViewport
		const undoScroll = () => {
			if (window.scrollY !== 0 || (viewport?.offsetTop ?? 0) !== 0) {
				window.scrollTo(0, 0)
			}
		}
		viewport?.addEventListener('scroll', undoScroll)
		viewport?.addEventListener('resize', undoScroll)
		window.addEventListener('scroll', undoScroll)

		return () => {
			viewport?.removeEventListener('scroll', undoScroll)
			viewport?.removeEventListener('resize', undoScroll)
			window.removeEventListener('scroll', undoScroll)
			style.overflow = previous.overflow
			style.overscrollBehavior = previous.overscrollBehavior
		}
	}, [])
}
