import { useTranslation } from 'react-i18next'
import type { NamedLeaderboardEntry } from '../../model/gameSelectors'
import { useTimestampGate } from '../hooks/useTimestampGate'

const LEADERBOARD_LIST_DELAY_MS = 200

interface RoomLeaderboardOverlayProps {
	entries: NamedLeaderboardEntry[]
	viewerParticipantId: string
	shownAt: number
}

export function RoomLeaderboardOverlay({
	entries,
	viewerParticipantId,
	shownAt,
}: RoomLeaderboardOverlayProps) {
	const { t } = useTranslation()
	const showList = useTimestampGate(shownAt, LEADERBOARD_LIST_DELAY_MS)

	if (!entries.length || !showList) {
		return null
	}

	return (
		<div className='pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4 py-24'>
			<section className='animate-[room-overlay-panel_320ms_ease-out_both] pointer-events-none w-full max-w-xl select-none rounded-4xl border border-white/14 bg-slate-950/84 p-5 text-white shadow-[0_30px_80px_rgba(15,23,42,0.48)] backdrop-blur-md sm:p-6'>
				<p className='text-center text-[11px] font-black uppercase tracking-[0.24em] text-slate-300'>
					{t('multiplayer.game.roundLeaders')}
				</p>
				<h2 className='mt-3 text-center text-3xl font-black tracking-tight'>
					{t('multiplayer.game.topFive')}
				</h2>

				<div className='mt-6 space-y-3'>
					{entries.map(entry => {
						const isViewer = entry.participantId === viewerParticipantId

						return (
							<div
								key={entry.participantId}
								className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${isViewer ? 'border-amber-300/70 bg-amber-400/16' : 'border-white/10 bg-white/6'}`}
							>
								<div className='min-w-0'>
									<p className='truncate text-base font-black'>
										#{entry.rank} {entry.name}
									</p>
									<p className='mt-1 text-sm text-slate-300'>
										{t('multiplayer.game.correctAnswers', {
											count: entry.correctCount,
										})}
									</p>
								</div>
								<p className='text-2xl font-black tracking-tight'>
									{entry.score}
								</p>
							</div>
						)
					})}
				</div>
			</section>
		</div>
	)
}
