import { Timer } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils'

interface GameHudProps {
	current: number
	total: number
	/** Rounds already finished; drives the progress strip. */
	completed: number
	targetName: string
	targetFlagUrl?: string
	start?: ReactNode
	end?: ReactNode
}

export function GameHud({
	current,
	total,
	completed,
	targetName,
	targetFlagUrl,
	start,
	end,
}: GameHudProps) {
	const { t } = useTranslation()
	const percent = total > 0 ? Math.min(100, (completed / total) * 100) : 0

	return (
		<header className='relative z-20 shrink-0 bg-slate-950 text-white'>
			<div className='mx-auto grid w-full max-w-5xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-5'>
				<div className='flex items-center gap-2'>{start}</div>

				<div
					className='flex min-w-0 flex-col items-center text-center'
					aria-live='polite'
				>
					<p
						className='text-xs font-extrabold text-white/60 tabular-nums'
						aria-label={t('game.progress', { current, total })}
					>
						{current}/{total}
					</p>
					<h1
						key={targetName}
						className={cn(
							'flex max-w-full animate-pop-in items-center gap-2 text-xl leading-tight font-black tracking-tight transition-colors duration-300 sm:text-3xl',
						)}
					>
						<span className='truncate'>{targetName}</span>
						{targetFlagUrl ? (
							<img
								src={targetFlagUrl}
								alt=''
								className='h-5 w-auto shrink-0 rounded-[4px] shadow-[0_0_0_2px_rgb(255_255_255/0.25)] sm:h-6'
							/>
						) : null}
					</h1>
				</div>

				<div className='flex items-center justify-end gap-2'>{end}</div>
			</div>

			<div aria-hidden='true' className='h-1 w-full bg-white/10'>
				<div
					className='h-full rounded-r-full bg-grass-400 transition-[width] duration-700 ease-out'
					style={{ width: `${percent}%` }}
				/>
			</div>
		</header>
	)
}

function formatClock(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function TimerChip({
	seconds,
	urgent = false,
	label,
}: {
	seconds: number
	urgent?: boolean
	label: string
}) {
	return (
		<span
			role='timer'
			aria-label={`${label}: ${formatClock(seconds)}`}
			key={urgent ? seconds : 'calm'}
			className={cn(
				'inline-flex items-center gap-1.5 px-1 text-xl font-black tabular-nums',
				urgent ? 'animate-bump text-coral-400' : 'text-sunflower-300',
			)}
		>
			<Timer aria-hidden='true' className='size-5' strokeWidth={2.75} />
			{formatClock(seconds)}
		</span>
	)
}
