import { cva, type VariantProps } from 'class-variance-authority'
import { CircleAlert, Info, TriangleAlert } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/utils'

const alertVariants = cva(
	'flex items-start gap-3 rounded-control border-2 px-4 py-3 text-sm font-bold',
	{
		variants: {
			tone: {
				info: 'border-ocean-200 bg-ocean-50 text-ocean-800',
				warning: 'border-sunflower-300 bg-sunflower-50 text-sunflower-900',
				error: 'border-coral-200 bg-coral-50 text-coral-700',
			},
		},
		defaultVariants: { tone: 'info' },
	},
)

const ALERT_ICONS = {
	info: Info,
	warning: TriangleAlert,
	error: CircleAlert,
} as const

function Alert({
	className,
	tone = 'info',
	children,
	...props
}: ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
	const Icon = ALERT_ICONS[tone ?? 'info']

	return (
		<div
			data-slot='alert'
			role={tone === 'error' ? 'alert' : 'status'}
			className={cn(alertVariants({ tone }), className)}
			{...props}
		>
			<Icon
				aria-hidden='true'
				className='mt-px size-5 shrink-0'
				strokeWidth={2.5}
			/>
			<div className='min-w-0'>{children}</div>
		</div>
	)
}

export { Alert }
