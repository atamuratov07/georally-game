import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/utils'

const badgeVariants = cva(
	"inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-xs font-extrabold whitespace-nowrap uppercase [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:stroke-[2.75]",
	{
		variants: {
			tone: {
				neutral: 'border-line bg-paper text-muted',
				ocean: 'border-ocean-200 bg-ocean-50 text-ocean-700',
				grass: 'border-grass-200 bg-grass-50 text-grass-700',
				sunflower:
					'border-sunflower-200 bg-sunflower-50 text-sunflower-800',
				coral: 'border-coral-200 bg-coral-50 text-coral-700',
				grape: 'border-grape-200 bg-grape-50 text-grape-700',
			},
		},
		defaultVariants: { tone: 'neutral' },
	},
)

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>

function Badge({
	className,
	tone,
	...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
	return (
		<span
			data-slot='badge'
			className={cn(badgeVariants({ tone }), className)}
			{...props}
		/>
	)
}

export { Badge }
