import { useTranslation } from 'react-i18next'
import { cn } from '../../shared/utils'
import type { NamedLeaderboardEntry } from '../model/gameSelectors'

interface ResultsListProps {
	entries: readonly NamedLeaderboardEntry[]
	viewerMemberId: string
}

export function ResultsList({
	entries,
	viewerMemberId,
}: ResultsListProps) {
	const { t } = useTranslation()
	if (!entries.length) {
		return null
	}

	return (
		<div className='mt-8 space-y-3'>
			{entries.map(entry => {
				const isViewer = entry.participantId === viewerMemberId

				return (
					<div
						key={entry.participantId}
						className={cn(
							'flex items-center justify-between gap-3 rounded-2xl border px-4 py-3',
							isViewer
								? 'border-amber-300 bg-amber-50'
								: 'border-slate-200 bg-slate-50',
						)}
					>
						<div className='min-w-0'>
							<p className='truncate text-base font-black text-slate-950'>
								#{entry.rank} {entry.name}
							</p>
							<p className='mt-1 text-sm text-slate-600'>
								{t('multiplayer.game.correctAnswers', {
									count: entry.correctCount,
								})}
							</p>
						</div>
						<p className='text-2xl font-black tracking-tight text-slate-950'>
							{entry.score}
						</p>
					</div>
				)
			})}
		</div>
	)
}
