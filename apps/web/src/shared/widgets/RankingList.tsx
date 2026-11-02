import { useTranslation } from 'react-i18next'
import { Avatar } from '@/shared/ui'
import { cn } from '@/shared/utils'

export interface RankingEntry {
	participantId: string
	rank: number
	name: string
	score: number
	correctCount: number
	colorIndex?: number
}

const MEDAL_CLASSES: Record<number, string> = {
	1: 'bg-sunflower-400 text-ink',
	2: 'bg-line-strong text-ink',
	3: 'bg-coral-300 text-coral-900',
}

export function RankingList({
	entries,
	viewerId,
	className,
}: {
	entries: readonly RankingEntry[]
	viewerId?: string
	className?: string
}) {
	const { t } = useTranslation()

	return (
		<ol className={cn('flex flex-col', className)}>
			{entries.map((entry, index) => {
				const isViewer = entry.participantId === viewerId

				return (
					<li
						key={entry.participantId}
						style={{ animationDelay: `${index * 60}ms` }}
						className={cn(
							'flex animate-pop-in items-center gap-3 rounded-control px-3 py-2.5',
							isViewer && 'bg-sunflower-100',
						)}
					>
						<span
							className={cn(
								'grid size-7 shrink-0 place-items-center rounded-full text-sm font-black tabular-nums',
								MEDAL_CLASSES[entry.rank] ?? 'text-muted',
							)}
						>
							{entry.rank}
						</span>
						<Avatar
							name={entry.name}
							size='sm'
							colorIndex={entry.colorIndex}
						/>
						<span className='min-w-0 flex-1'>
							<span className='block truncate font-extrabold'>
								{entry.name}
							</span>
							<span className='block text-xs font-bold text-muted'>
								{t('game.correctCount', { count: entry.correctCount })}
							</span>
						</span>
						<span className='text-xl font-black tabular-nums'>
							{entry.score}
						</span>
					</li>
				)
			})}
		</ol>
	)
}
