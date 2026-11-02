import { cva, type VariantProps } from 'class-variance-authority'
import { Check } from 'lucide-react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/utils'

function RadioGroup({
	className,
	...props
}: ComponentProps<typeof RadioGroupPrimitive.Root>) {
	return (
		<RadioGroupPrimitive.Root
			data-slot='radio-group'
			className={cn('grid gap-3', className)}
			{...props}
		/>
	)
}

const radioCardVariants = cva(
	[
		'group/radio-card pressable relative flex h-full w-full flex-col items-start gap-3 rounded-card border-2 p-4 text-left',
		'border-line-strong bg-white text-ink [--edge:var(--color-line-strong)] hover:bg-paper',
		'disabled:cursor-not-allowed disabled:opacity-55',
	],
	{
		variants: {
			tone: {
				ocean: 'data-[state=checked]:border-ocean-500 data-[state=checked]:bg-ocean-50 data-[state=checked]:[--edge:var(--color-ocean-500)]',
				grape: 'data-[state=checked]:border-grape-500 data-[state=checked]:bg-grape-50 data-[state=checked]:[--edge:var(--color-grape-500)]',
				grass: 'data-[state=checked]:border-grass-500 data-[state=checked]:bg-grass-50 data-[state=checked]:[--edge:var(--color-grass-500)]',
				sunflower:
					'data-[state=checked]:border-sunflower-500 data-[state=checked]:bg-sunflower-50 data-[state=checked]:[--edge:var(--color-sunflower-500)]',
			},
		},
		defaultVariants: { tone: 'ocean' },
	},
)

const radioCheckVariants = cva(
	'absolute top-3.5 right-3.5 grid size-7 place-items-center rounded-full border-2 border-line-strong bg-white text-transparent transition-colors group-data-[state=checked]/radio-card:text-white',
	{
		variants: {
			tone: {
				ocean: 'group-data-[state=checked]/radio-card:border-ocean-500 group-data-[state=checked]/radio-card:bg-ocean-500',
				grape: 'group-data-[state=checked]/radio-card:border-grape-500 group-data-[state=checked]/radio-card:bg-grape-500',
				grass: 'group-data-[state=checked]/radio-card:border-grass-500 group-data-[state=checked]/radio-card:bg-grass-500',
				sunflower:
					'group-data-[state=checked]/radio-card:border-sunflower-500 group-data-[state=checked]/radio-card:bg-sunflower-500',
			},
		},
		defaultVariants: { tone: 'ocean' },
	},
)

function RadioCard({
	className,
	tone,
	children,
	...props
}: ComponentProps<typeof RadioGroupPrimitive.Item> &
	VariantProps<typeof radioCardVariants>) {
	return (
		<RadioGroupPrimitive.Item
			data-slot='radio-card'
			className={cn(radioCardVariants({ tone }), className)}
			{...props}
		>
			<span aria-hidden='true' className={radioCheckVariants({ tone })}>
				<Check className='size-4' strokeWidth={3.5} />
			</span>
			{children}
		</RadioGroupPrimitive.Item>
	)
}

export { RadioCard, RadioGroup }
