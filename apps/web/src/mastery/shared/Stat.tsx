import type { ReactNode } from 'react'
import { cn } from '@/shared/utils'
import { outlinedText } from '@/shared/widgets/outlinedText'

const OUTLINED_LABEL = outlinedText(4, 3)

export function Stat({
	value,
	label,
	outlined = false,
	className,
	valueClassName,
}: {
	value: ReactNode
	label: string
	outlined?: boolean
	className?: string
	valueClassName?: string
}) {
	return (
		<div className={cn('flex flex-col items-center', className)}>
			<span
				className={cn(
					'text-6xl font-black tracking-tight tabular-nums',
					valueClassName,
				)}
			>
				{value}
			</span>
			<span
				className={cn(
					'font-extrabold',
					outlined ? 'mt-1 text-lg text-white' : 'text-sm text-muted',
				)}
				style={outlined ? OUTLINED_LABEL : undefined}
			>
				{label}
			</span>
		</div>
	)
}
