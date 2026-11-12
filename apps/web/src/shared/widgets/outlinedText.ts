import type { CSSProperties } from 'react'

export function outlinedText(
	stroke: number,
	drop: number,
	unit: 'px' | 'em' = 'px',
): CSSProperties {
	return {
		WebkitTextStroke: `${stroke}${unit} var(--color-ink)`,
		paintOrder: 'stroke fill',
		textShadow: `0 ${drop}${unit} 0 var(--color-ink)`,
	}
}
