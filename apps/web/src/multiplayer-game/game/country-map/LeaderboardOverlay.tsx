import { useTranslation } from 'react-i18next'
import { Card } from '@/shared/ui'
import { RankingList, type RankingEntry } from '@/shared/widgets/RankingList'
import { useTimestampGate } from '../hooks/useTimestampGate'

const LEADERBOARD_LIST_DELAY_MS = 200

interface RoomLeaderboardOverlayProps {
	entries: RankingEntry[]
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
		<div className='pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-ink/25 px-4 py-6'>
			<Card className='floating w-full max-w-md animate-pop-in select-none'>
				<h2 className='mb-4 text-center text-2xl font-black tracking-tight'>
					{t('game.leaderboard')}
				</h2>
				<RankingList entries={entries} viewerId={viewerParticipantId} />
			</Card>
		</div>
	)
}
