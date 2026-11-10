import { cn } from '@/shared/utils'

export function DemoStrip({
	fraction,
	frozen,
}: {
	fraction: number
	frozen: boolean
}) {
	return (
		<div className='h-2 w-full bg-ink/15'>
			<div
				className={cn(
					'h-full rounded-r-full transition-[width,background-color] duration-300 ease-linear',
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
