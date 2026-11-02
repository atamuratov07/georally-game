import type { ComponentProps } from 'react'
import { cn } from '@/shared/utils'

function Input({
	className,
	type = 'text',
	...props
}: ComponentProps<'input'>) {
	return (
		<input
			type={type}
			data-slot='input'
			className={cn(
				'h-12 w-full min-w-0 rounded-control border-2 border-line-strong bg-white px-4 text-base font-bold text-ink',
				'shadow-[inset_0_3px_0_0_var(--color-paper-deep)] outline-none transition-[border-color,box-shadow]',
				'placeholder:font-semibold placeholder:text-muted/70',
				'focus-visible:border-ocean-500 focus-visible:ring-4 focus-visible:ring-ocean-200 focus-visible:outline-none',
				'aria-invalid:border-coral-500 disabled:cursor-not-allowed disabled:opacity-55',
				className,
			)}
			{...props}
		/>
	)
}

export { Input }
