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
			<div className='mx-auto grid w-full max-w-5xl grid-cols-[minmax(max-content,1fr)_minmax(0,auto)_minmax(max-content,1fr)] items-center gap-x-2 gap-y-1 px-3 py-2.5 sm:gap-x-4 sm:px-5'>
				<div className='col-start-1 row-start-1 flex items-center gap-2'>
					{start}
				</div>

				<div className='max-sm:contents sm:col-start-2 sm:row-start-1 sm:flex sm:min-w-0 sm:flex-col sm:items-center'>
					<p
						className='col-start-2 row-start-1 text-center text-xs font-extrabold text-white/60 tabular-nums'
						aria-label={t('game.progress', { current, total })}
					>
						{current}/{total}
					</p>
					<h1
						key={targetName}
						aria-live='polite'
						className='flex max-w-full min-w-0 animate-pop-in items-center justify-center gap-2 text-center text-xl leading-tight font-black tracking-tight max-sm:col-span-3 max-sm:row-start-2 sm:text-3xl'
					>
						<span className='text-balance sm:truncate'>{targetName}</span>
						{targetFlagUrl ? (
							<img
								src={targetFlagUrl}
								alt=''
								className='h-5 w-auto shrink-0 rounded-[4px] shadow-[0_0_0_2px_rgb(255_255_255/0.25)] sm:h-6'
							/>
						) : null}
					</h1>
				</div>

				<div className='col-start-3 row-start-1 flex items-center justify-end gap-2'>
					{end}
				</div>
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
				'inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-base font-black text-white tabular-nums shadow-[0_3px_0_0_var(--edge)] [text-shadow:0_1px_0_var(--edge)] sm:h-9 sm:gap-1.5 sm:px-3 sm:text-lg',
				urgent
					? 'animate-bump bg-coral-500 [--edge:var(--color-coral-700)]'
					: 'bg-sunflower-500 [--edge:var(--color-sunflower-700)]',
			)}
		>
			<Timer
				aria-hidden='true'
				className='size-4 sm:size-4.5'
				strokeWidth={2.75}
			/>
			{formatClock(seconds)}
		</span>
	)
}
