import { useEffect } from 'react'

export function useDocumentBackground(color: string): void {
	useEffect(() => {
		const { style } = document.documentElement
		const previous = style.backgroundColor
		style.backgroundColor = color
		return () => {
			style.backgroundColor = previous
		}
	}, [color])
}
