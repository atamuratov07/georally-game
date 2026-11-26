import type { ControlTone } from '@/shared/ui'

interface ModeToneClasses {
	fill: string
	idle: string
	text: string
}

export const MODE_TONES: Record<ControlTone, ModeToneClasses> = {
	sunflower: {
		fill: 'border-sunflower-500 bg-sunflower-400 text-ink [--edge:var(--color-sunflower-600)]',
		idle: 'text-sunflower-700 [--edge:var(--color-sunflower-300)]',
		text: 'text-sunflower-700',
	},
	ocean: {
		fill: 'border-ocean-600 bg-ocean-500 text-white [--edge:var(--color-ocean-700)]',
		idle: 'text-ocean-600 [--edge:var(--color-ocean-200)]',
		text: 'text-ocean-600',
	},
	coral: {
		fill: 'border-coral-600 bg-coral-500 text-white [--edge:var(--color-coral-700)]',
		idle: 'text-coral-600 [--edge:var(--color-coral-200)]',
		text: 'text-coral-600',
	},
	grass: {
		fill: 'border-grass-600 bg-grass-500 text-white [--edge:var(--color-grass-700)]',
		idle: 'text-grass-700 [--edge:var(--color-grass-200)]',
		text: 'text-grass-700',
	},
	grape: {
		fill: 'border-grape-600 bg-grape-500 text-white [--edge:var(--color-grape-700)]',
		idle: 'text-grape-600 [--edge:var(--color-grape-200)]',
		text: 'text-grape-600',
	},
}
