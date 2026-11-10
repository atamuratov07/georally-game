import type { PointerEvent, ReactNode } from 'react'
import { useDocumentBackground } from '@/shared/lib/useDocumentBackground'
import { useDocumentScrollLock } from '@/shared/lib/useDocumentScrollLock'
import { WATER_FILL } from '@/shared/map/map-styles'

function keepInputFocus(event: PointerEvent<HTMLElement>) {
	if ((event.target as Element).closest('button')) {
		event.preventDefault()
	}
}

export function KeyboardGameFrame({ children }: { children: ReactNode }) {
	useDocumentScrollLock()
	useDocumentBackground(WATER_FILL)

	return (
		<div
			className='fixed inset-0 touch-none overflow-hidden'
			style={{ backgroundColor: WATER_FILL }}
			onPointerDownCapture={keepInputFocus}
		>
			{children}
		</div>
	)
}
