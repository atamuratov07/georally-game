import { useNow } from '@/shared/time/useNow'
import { cn } from '@/shared/utils'

const TICK_MS = 250

interface CountdownBarProps {
	variant: 'edge' | 'strip'
	deadlineAt: number | null
	frozenAt: number | null
	limitMs: number
}

export function CountdownBar({
	variant,
	deadlineAt,
	frozenAt,
	limitMs,
}: CountdownBarProps) {
	const refilling = deadlineAt === null
	const frozen = !refilling && frozenAt !== null
	const now = useNow(TICK_MS, !refilling && frozenAt === null)
	const fraction = refilling
		? 1
		: Math.max(0, deadlineAt - (frozenAt ?? now)) / limitMs

	return (
		<div
			aria-hidden='true'
			className={cn(
				'w-full',
				variant === 'edge' ? 'h-2 bg-ink/15' : 'h-2 bg-ink/10',
			)}
		>
			<div
				className={cn(
					'h-full animate-bar-fill',
					'rounded-r-full',
					refilling
						? 'transition-[width] duration-500 ease-out'
						: 'transition-[width,background-color] duration-250 ease-linear',
					frozen
						? 'bg-ink/25'
						: fraction > 0.5
							? 'bg-grass-500'
							: fraction > 0.25
								? 'bg-sunflower-500'
								: 'bg-coral-500',
				)}
				style={{ width: `${fraction * 100}%` }}
			/>
		</div>
	)
}
