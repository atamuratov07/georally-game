import { cn } from '../utils'

export function mapControlClass(isCurrent: boolean): string {
	return cn(
		'grid size-11 place-items-center rounded-control border-2 transition-[translate,box-shadow,background-color,color] duration-150',
		'disabled:cursor-not-allowed disabled:opacity-45',
		isCurrent
			? 'translate-y-1 cursor-default border-line-strong bg-paper-deep text-muted'
			: [
					'border-ocean-600 bg-ocean-500 text-white shadow-[0_4px_0_0_var(--color-ocean-700)]',
					'enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_6px_0_0_var(--color-ocean-700)]',
					'enabled:active:translate-y-1 enabled:active:shadow-none',
				],
	)
}
