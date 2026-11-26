export type ControlTone = 'ocean' | 'grass' | 'sunflower' | 'coral' | 'grape'

// A lit control's face and the edge under it.
export const LIT_TONES: Record<ControlTone, string> = {
	ocean: 'border-ocean-600 bg-ocean-500 [--edge:var(--color-ocean-700)]',
	grass: 'border-grass-600 bg-grass-500 [--edge:var(--color-grass-700)]',
	sunflower:
		'border-sunflower-500 bg-sunflower-400 [--edge:var(--color-sunflower-600)]',
	coral: 'border-coral-600 bg-coral-500 [--edge:var(--color-coral-700)]',
	grape: 'border-grape-600 bg-grape-500 [--edge:var(--color-grape-700)]',
}
