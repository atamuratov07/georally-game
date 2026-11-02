import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/utils'

const buttonVariants = cva(
	[
		'pressable inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap select-none',
		'rounded-control border-2 font-extrabold tracking-tight',
		'disabled:opacity-55 disabled:[--edge-size:2px] aria-disabled:opacity-55',
		"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5 [&_svg]:stroke-[2.5]",
	],
	{
		variants: {
			variant: {
				primary:
					'border-sunflower-500 bg-sunflower-400 text-ink [--edge:var(--color-sunflower-600)]',
				ocean: 'border-ocean-600 bg-ocean-500 text-white [--edge:var(--color-ocean-700)]',
				grass: 'border-grass-600 bg-grass-500 text-white [--edge:var(--color-grass-700)]',
				grape: 'border-grape-600 bg-grape-500 text-white [--edge:var(--color-grape-700)]',
				coral: 'border-coral-600 bg-coral-500 text-white [--edge:var(--color-coral-700)]',
				neutral:
					'border-line-strong bg-white text-ink [--edge:var(--color-line-strong)]',
				ghost: 'border-transparent bg-transparent text-ink [--edge-size:0px] hover:bg-ink/6',
			},
			size: {
				sm: 'h-10 px-3.5 text-sm',
				md: 'h-12 px-5 text-base',
				lg: 'h-14 px-7 text-lg',
				icon: 'size-11',
				'icon-sm': "size-9 [&_svg:not([class*='size-'])]:size-4",
			},
		},
		defaultVariants: {
			variant: 'primary',
			size: 'md',
		},
	},
)

export type ButtonProps = ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean
		pending?: boolean
	}

function Button({
	className,
	variant,
	size,
	asChild = false,
	pending = false,
	disabled,
	children,
	...props
}: ButtonProps) {
	const Comp = asChild ? Slot.Root : 'button'

	return (
		<Comp
			data-slot='button'
			className={cn(buttonVariants({ variant, size, className }))}
			disabled={asChild ? undefined : disabled || pending}
			aria-busy={pending || undefined}
			{...props}
		>
			{asChild ? (
				children
			) : (
				<>
					{pending ? (
						<LoaderCircle aria-hidden='true' className='animate-spin' />
					) : null}
					{children}
				</>
			)}
		</Comp>
	)
}

export { Button }
