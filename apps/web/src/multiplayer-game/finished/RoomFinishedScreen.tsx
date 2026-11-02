import type { RoomFinishedView } from '@georally/game-domain/multiplayer'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { PageShell } from '@/shared/layout'
import { Button, Card, CardHeader, CardTitle, TextButton } from '@/shared/ui'
import { RankingList } from '@/shared/widgets/RankingList'
import { celebrate } from '@/shared/lib/confetti'
import { cn } from '@/shared/utils'
import { RoomNotices } from '@/shared/widgets/RoomNotices'
import { getLeaderboardEntries } from '../model/gameSelectors'
import { getMemberColorIndexes } from '../model/roomSelectors'

interface RoomFinishedScreenCapabilities {
	canPlayAgain: boolean
	canTerminateRoom: boolean
	canLeaveRoom: boolean
}

interface RoomFinishedScreenProps {
	room: RoomFinishedView
	capabilities: RoomFinishedScreenCapabilities
	isReconnecting: boolean
	playAgainPending?: boolean
	terminatePending?: boolean
	actionErrorMessage?: string | null
	onPlayAgain?: () => void
	onTerminateRoom?: () => void
}

const PLACE_COLORS: Record<number, string> = {
	1: 'text-sunflower-400 [--place-edge:var(--color-sunflower-600)]',
	2: 'text-[#a3b3c7] [--place-edge:#6b7b93]',
	3: 'text-coral-400 [--place-edge:var(--color-coral-700)]',
}

function Place({ rank }: { rank: number }) {
	const { t } = useTranslation()

	return (
		<motion.p
			aria-label={`${t('multiplayer.finished.yourPlace')}: ${rank}`}
			className={cn(
				'text-center text-[7rem] leading-none font-black tabular-nums [text-shadow:0_8px_0_var(--place-edge)]',
				PLACE_COLORS[rank] ??
					'text-ocean-500 [--place-edge:var(--color-ocean-700)]',
			)}
			initial={{ scale: 0.3, rotate: -12, opacity: 0 }}
			animate={{ scale: 1, rotate: 0, opacity: 1 }}
			transition={{ type: 'spring', stiffness: 320, damping: 13 }}
		>
			<span className='align-top text-5xl'>#</span>
			{rank}
		</motion.p>
	)
}

export function RoomFinishedScreen({
	room,
	capabilities,
	isReconnecting,
	playAgainPending = false,
	terminatePending = false,
	actionErrorMessage = null,
	onPlayAgain,
	onTerminateRoom,
}: RoomFinishedScreenProps) {
	const { t } = useTranslation()
	const isClassroomHost =
		room.roomMode === 'classroom' && room.viewerRole === 'host'
	const viewerEntry = isClassroomHost ? null : room.viewerLeaderboardEntry
	const colorIndexes = getMemberColorIndexes(room.members)
	const entries = getLeaderboardEntries(
		room.lastGameResult,
		room.members,
		5,
	).map(entry => ({
		...entry,
		colorIndex: colorIndexes.get(entry.participantId),
	}))

	useEffect(() => {
		celebrate()
	}, [])

	return (
		<PageShell width='md'>
			<RoomNotices
				isReconnecting={isReconnecting}
				actionErrorMessage={actionErrorMessage}
			/>
			<Card>
				{viewerEntry ? (
					<>
						<h1 className='sr-only'>{t('multiplayer.finished.title')}</h1>
						<div className='mb-4'>
							<Place rank={viewerEntry.rank} />
						</div>
					</>
				) : (
					<CardHeader className='items-center text-center'>
						<CardTitle asChild>
							<h1>{t('multiplayer.finished.title')}</h1>
						</CardTitle>
					</CardHeader>
				)}

				<RankingList entries={entries} viewerId={room.viewerMemberId} />

				<div className='mt-7 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-center sm:gap-5'>
					{capabilities.canTerminateRoom && onTerminateRoom ? (
						<TextButton
							type='button'
							tone='coral'
							disabled={terminatePending}
							onClick={onTerminateRoom}
						>
							{t('multiplayer.lobby.closeRoom')}
						</TextButton>
					) : null}
					{capabilities.canPlayAgain && onPlayAgain ? (
						<Button
							type='button'
							className='w-full sm:w-auto'
							pending={playAgainPending}
							onClick={onPlayAgain}
						>
							{t('multiplayer.finished.playAgain')}
						</Button>
					) : null}
					{capabilities.canLeaveRoom ? (
						<>
							<TextButton asChild>
								<LocalizedLink to='/'>{t('common.home')}</LocalizedLink>
							</TextButton>
							<Button
								asChild
								variant='grape'
								className='w-full sm:w-auto'
							>
								<LocalizedLink to='/multiplayer'>
									{t('multiplayer.finished.joinAnother')}
								</LocalizedLink>
							</Button>
						</>
					) : null}
				</div>
			</Card>
		</PageShell>
	)
}
