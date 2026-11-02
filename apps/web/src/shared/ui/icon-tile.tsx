import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/utils'

const iconTileVariants = cva(
	'raised grid shrink-0 place-items-center border-2 [--edge-size:4px] [&_svg]:stroke-[2.5]',
	{
		variants: {
			tone: {
				ocean: 'border-ocean-600 bg-ocean-500 text-white [--edge:var(--color-ocean-700)]',
				grass: 'border-grass-600 bg-grass-500 text-white [--edge:var(--color-grass-700)]',
				sunflower:
					'border-sunflower-500 bg-sunflower-400 text-ink [--edge:var(--color-sunflower-600)]',
				coral: 'border-coral-600 bg-coral-500 text-white [--edge:var(--color-coral-700)]',
				grape: 'border-grape-600 bg-grape-500 text-white [--edge:var(--color-grape-700)]',
				neutral:
					'border-line-strong bg-white text-ink [--edge:var(--color-line-strong)]',
			},
			size: {
				sm: "size-10 rounded-[12px] [&_svg:not([class*='size-'])]:size-5",
				md: "size-14 rounded-control [&_svg:not([class*='size-'])]:size-7",
				lg: "size-20 rounded-[20px] [&_svg:not([class*='size-'])]:size-10",
			},
		},
		defaultVariants: { tone: 'ocean', size: 'md' },
	},
)

export type IconTileTone = NonNullable<
	VariantProps<typeof iconTileVariants>['tone']
>

function IconTile({
	className,
	tone,
	size,
	...props
}: ComponentProps<'span'> & VariantProps<typeof iconTileVariants>) {
	return (
		<span
			aria-hidden='true'
			data-slot='icon-tile'
			className={cn(iconTileVariants({ tone, size }), className)}
			{...props}
		/>
	)
}

export { IconTile }
