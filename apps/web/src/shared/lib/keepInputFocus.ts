import type { PointerEvent } from 'react'

export function keepInputFocus(event: PointerEvent<HTMLElement>) {
	if ((event.target as Element).closest('button')) {
		event.preventDefault()
	}
}
