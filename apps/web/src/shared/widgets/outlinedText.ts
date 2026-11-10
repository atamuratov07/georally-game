import type { CSSProperties } from 'react'

export function outlinedText(strokePx: number, dropPx: number): CSSProperties {
	return {
		WebkitTextStroke: `${strokePx}px var(--color-ink)`,
		paintOrder: 'stroke fill',
		textShadow: `0 ${dropPx}px 0 var(--color-ink)`,
	}
}
