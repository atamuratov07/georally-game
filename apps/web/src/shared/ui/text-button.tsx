import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/utils'

const TONES = {
	muted: 'text-muted hover:text-ink',
	coral: 'text-coral-600 hover:text-coral-700',
} as const

function TextButton({
	className,
	tone = 'muted',
	asChild = false,
	...props
}: ComponentProps<'button'> & {
	tone?: keyof typeof TONES
	asChild?: boolean
}) {
	const Comp = asChild ? Slot.Root : 'button'

	return (
		<Comp
			data-slot='text-button'
			className={cn(
				'inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-2 text-base font-extrabold whitespace-nowrap underline-offset-4 transition-colors hover:underline disabled:pointer-events-none disabled:opacity-55',
				"[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5 [&_svg]:stroke-[2.75]",
				TONES[tone],
				className,
			)}
			{...props}
		/>
	)
}

export { TextButton }
