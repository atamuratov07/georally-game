import type { ReactNode } from 'react'
import { cn } from '@/shared/utils'

const TONES = {
	ocean: 'border-ocean-600 bg-ocean-500 [--edge:var(--color-ocean-700)]',
	coral: 'border-coral-600 bg-coral-500 [--edge:var(--color-coral-700)]',
	grass: 'border-grass-600 bg-grass-500 [--edge:var(--color-grass-700)]',
	grape: 'border-grape-600 bg-grape-500 [--edge:var(--color-grape-700)]',
} as const

export type ShowcaseTone = keyof typeof TONES

export function ShowcaseBadge({
	tone,
	children,
}: {
	tone: ShowcaseTone
	children: ReactNode
}) {
	return (
		<span
			className={cn(
				'raised inline-flex -rotate-3 items-center gap-1.5 rounded-full border-2 px-3.5 py-1 text-sm font-black tracking-wide text-white uppercase [--edge-size:3px]',
				TONES[tone],
			)}
		>
			{children}
		</span>
	)
}
