import { useTranslation } from 'react-i18next'
import { useCountdown } from '../hooks/useCountdown'

const URGENT_COUNTDOWN_SECONDS = 5

interface RoomGameHeaderProps {
	progressLabel: string
	questionLabel: string
	targetName: string
	targetFlagUrl?: string
	deadlineAt: number | null
}

function formatCountdown(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60

	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function QuestionBarChip({
	label,
	value,
	className,
}: {
	label: string
	value: string
	className?: string
}) {
	return (
		<div
			className={`rounded-full bg-white/12 px-3 py-2 text-left text-slate-100 ${className ?? ''}`}
		>
			<p className='text-[10px] font-black uppercase tracking-[0.18em] opacity-70'>
				{label}
			</p>
			<p className='text-sm font-black text-inherit tabular-nums'>{value}</p>
		</div>
	)
}

function CountdownTimer({
	deadlineAt,
}: {
	deadlineAt: number | null
}) {
	const { t } = useTranslation()
	const secondsLeft = useCountdown(deadlineAt)
	const isUrgent = secondsLeft <= URGENT_COUNTDOWN_SECONDS

	if (deadlineAt === null) {
		return null
	}

	return (
		<div
			key={isUrgent ? secondsLeft : 'normal'}
			className={`h-12 min-w-16 rounded-full flex items-center justify-center text-left ${
				isUrgent
					? 'countdown-badge-bump bg-red-600 text-white shadow-[0_0_14px_rgba(220,38,38,0.8)]'
					: 'bg-amber-400 text-slate-950'
			}`}
		>
			<div>
				<p className='text-[10px] font-black leading-none uppercase tracking-[0.18em] opacity-70'>
					{t('multiplayer.game.time')}
				</p>
				<p className='mt-1 h-4 text-sm font-black leading-4 text-inherit tabular-nums'>
					<span
						key={secondsLeft}
						className={`inline-block ${
							isUrgent ? 'countdown-time-bump' : ''
						}`}
					>
						{formatCountdown(secondsLeft)}
					</span>
				</p>
			</div>
		</div>
	)
}

export function GameQuestionBar({
	progressLabel,
	questionLabel,
	targetName,
	targetFlagUrl,
	deadlineAt,
}: RoomGameHeaderProps) {
	const { t } = useTranslation()

	return (
		<section className='w-full border-t border-white/12 bg-slate-950/88 px-4 pt-3 pb-8 text-white backdrop-blur-md'>
			<div className='grid w-full max-w-450 grid-cols-1 grid-rows-2 gap-x-3 md:grid-cols-3'>
				<div className='col-start-1 row-start-1 row-span-1 justify-self-start align-center md:row-span-2'>
					<QuestionBarChip
						label={t('multiplayer.game.round')}
						value={progressLabel}
						className='col-start-1 row-start-1 row-span-1 justify-self-start align-center md:row-span-2'
					/>
				</div>

				<div className='col-start-1 row-start-1 row-span-1 justify-self-center self-center text-center md:col-start-2'>
					<p className='text-[11px] font-black uppercase tracking-[0.22em] text-slate-300'>
						{questionLabel}
					</p>
				</div>
				<div className='row-start-2 col-start-1 col-span-1 flex flex-wrap items-center justify-center gap-2 self-start justify-self-center md:col-start-2'>
					<h1 className='text-2xl font-black tracking-tight text-white sm:text-3xl text-center'>
						{targetName}
					</h1>
					{targetFlagUrl ? (
						<img
							src={targetFlagUrl}
							alt=''
							className='h-5 w-7 rounded-sm border border-white/60 object-cover'
						/>
					) : null}
				</div>
				<div className='row-start-1 row-span-1 col-start-1 justify-self-end align-center md:row-span-2 md:col-start-3'>
					<CountdownTimer deadlineAt={deadlineAt} />
				</div>
			</div>
		</section>
	)
}
