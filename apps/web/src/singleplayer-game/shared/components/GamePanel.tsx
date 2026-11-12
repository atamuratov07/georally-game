import { useState, type ReactNode } from 'react'
import { GameHudRow, GameHudRowSpacer } from '@/shared/widgets/GameHud'
import { cn } from '@/shared/utils'

interface GamePanelProps {
	start?: ReactNode
	end?: ReactNode
	status?: ReactNode
	className?: string
	children?: ReactNode
}

export function GamePanel({
	start,
	end,
	status,
	className,
	children,
}: GamePanelProps) {
	return (
		<section
			className={cn(
				'fixed inset-0 z-30 flex flex-col overflow-hidden bg-slate-950 text-white',
				className,
			)}
		>
			<div
				aria-hidden='true'
				className='pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_50%,rgb(27_127_240/0.2),transparent_70%)]'
			/>
			<div className='relative shrink-0'>
				<GameHudRow start={start} end={end} center={<GameHudRowSpacer />} />
			</div>
			{children}
			{status ? (
				<div
					data-hud-part='status'
					className='absolute inset-x-0 top-1/2 -translate-y-[3px] sm:-translate-y-[5px]'
				>
					{status}
				</div>
			) : null}
		</section>
	)
}

const SWEEP_MS = 1150

interface LoadingStatusProps {
	label: string
	done?: boolean
}

export function LoadingStatus({ label, done = false }: LoadingStatusProps) {
	const [sweepDelay] = useState(
		() => `-${Math.round(performance.now() % SWEEP_MS)}ms`,
	)

	return (
		<div role='status' className='flex flex-col items-center gap-2.5'>
			<div className='relative h-1.5 w-37 overflow-hidden rounded-full bg-white/12 sm:h-2.5 sm:w-60'>
				<div
					className={cn(
						'absolute inset-y-0 left-0 rounded-full',
						done
							? 'w-full bg-grass-400'
							: 'w-2/5 animate-loading-sweep bg-sunflower-400',
					)}
					style={done ? undefined : { animationDelay: sweepDelay }}
				/>
			</div>
			<p
				key={label}
				className={cn(
					'text-sm font-bold text-white/55 sm:text-lg',
					done &&
						'animate-pop-in text-base font-black text-grass-400 sm:text-2xl',
				)}
			>
				{label}
			</p>
		</div>
	)
}
