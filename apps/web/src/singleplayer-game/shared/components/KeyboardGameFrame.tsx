import type { ReactNode } from 'react'
import { keepInputFocus } from '@/shared/lib/keepInputFocus'
import { useDocumentBackground } from '@/shared/lib/useDocumentBackground'
import { useDocumentScrollLock } from '@/shared/lib/useDocumentScrollLock'
import { WATER_FILL } from '@/shared/map/map-styles'

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
