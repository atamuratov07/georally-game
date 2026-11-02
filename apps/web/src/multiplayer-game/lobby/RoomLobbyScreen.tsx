import type { GameConfig, RoomMode } from '@georally/game-domain/multiplayer'
import type {
	RoomMemberRole,
	VisibleMemberInfo,
} from '@georally/game-domain/multiplayer/room'
import { Crown, LoaderCircle, Play } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PageShell } from '@/shared/layout'
import {
	Avatar,
	Badge,
	Button,
	Card,
	CardHeader,
	CardTitle,
	CopyButton,
	TextButton,
} from '@/shared/ui'
import { cn } from '@/shared/utils'
import { RoomNotices } from '@/shared/widgets/RoomNotices'
import { GameConfigPanel } from './GameConfigPanel'

interface RoomLobbyScreenProps {
	role: RoomMemberRole
	roomCode: string
	roomMode: RoomMode
	viewerMemberId: string
	members: VisibleMemberInfo[]
	requireQuestionDuration?: boolean
	startPending?: boolean
	terminatePending?: boolean
	actionErrorMessage?: string | null
	isReconnecting?: boolean
	onStartGame?: (config: GameConfig) => void
	onTerminateRoom?: () => void
}

function RoomCode({
	roomCode,
	roomMode,
}: {
	roomCode: string
	roomMode: RoomMode
}) {
	const { t } = useTranslation()
	const inviteUrl = useMemo(
		() =>
			new URL(`/multiplayer/room/${roomCode}`, location.origin).toString(),
		[roomCode],
	)

	return (
		<section className='flex flex-col items-center gap-3 py-2 text-center sm:py-4'>
			<p className='text-sm font-extrabold text-muted'>
				{t('multiplayer.lobby.roomCode')}
			</p>
			<h1 className='animate-pop-in text-4xl font-black tracking-[0.12em] text-ink select-all sm:text-5xl'>
				{roomCode}
			</h1>
			<Badge tone={roomMode === 'classroom' ? 'ocean' : 'grape'}>
				{t(`multiplayer.modes.${roomMode}.title`)}
			</Badge>
			<div className='flex gap-2.5'>
				<CopyButton
					size='sm'
					textToCopy={roomCode}
					aria-label={t('multiplayer.lobby.copyCodeLabel')}
				>
					{t('multiplayer.lobby.copyCode')}
				</CopyButton>
				<CopyButton
					size='sm'
					textToCopy={inviteUrl}
					aria-label={t('multiplayer.lobby.copyLinkLabel')}
				>
					{t('multiplayer.lobby.copyLink')}
				</CopyButton>
			</div>
		</section>
	)
}

function PlayersCard({
	members,
	viewerMemberId,
}: {
	members: VisibleMemberInfo[]
	viewerMemberId: string
}) {
	const { t } = useTranslation()
	const hasPlayers = members.some(member => !member.isHost)

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-baseline gap-2.5 text-xl sm:text-2xl'>
					{t('multiplayer.lobby.players')}
					<span className='text-muted tabular-nums'>{members.length}</span>
				</CardTitle>
			</CardHeader>

			<ul className='grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-3'>
				{members.map(member => (
					<li
						key={member.memberId}
						className={cn(
							'flex min-w-0 animate-pop-in flex-col items-center gap-2 text-center',
							!member.connected && 'opacity-60',
						)}
					>
						<span className='relative'>
							<Avatar
								name={member.name}
								size='lg'
								offline={!member.connected}
							/>
							{member.isHost ? (
								<Crown
									aria-label={t('multiplayer.lobby.host')}
									className='absolute -top-3 left-1/2 size-6 -translate-x-1/2 rotate-[-8deg] fill-sunflower-400 text-sunflower-600'
									strokeWidth={2.5}
								/>
							) : null}
						</span>
						<span className='w-full truncate text-sm font-extrabold sm:text-base'>
							{member.name}
							{member.memberId === viewerMemberId ? (
								<span className='block text-xs font-bold text-muted'>
									{t('multiplayer.lobby.you')}
								</span>
							) : null}
						</span>
					</li>
				))}
			</ul>

			{hasPlayers ? null : (
				<p className='mt-6 text-center text-sm font-bold text-muted'>
					{t('multiplayer.lobby.noPlayers')}
				</p>
			)}
		</Card>
	)
}

export function RoomLobbyScreen({
	role,
	roomCode,
	roomMode,
	viewerMemberId,
	requireQuestionDuration,
	members,
	startPending = false,
	terminatePending = false,
	actionErrorMessage = null,
	isReconnecting = false,
	onStartGame,
	onTerminateRoom,
}: RoomLobbyScreenProps) {
	const { t } = useTranslation()
	const isHost = role === 'host'
	const gameConfigFormId = `room-game-config-${roomCode}`

	return (
		<PageShell width='xl' className='gap-6 pb-32'>
			<RoomNotices
				isReconnecting={isReconnecting}
				actionErrorMessage={actionErrorMessage}
			/>

			<RoomCode roomCode={roomCode} roomMode={roomMode} />

			<div
				className={cn(
					'grid items-start gap-6',
					isHost &&
						onStartGame &&
						'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]',
				)}
			>
				{isHost && onStartGame ? (
					<GameConfigPanel
						roomCode={roomCode}
						formId={gameConfigFormId}
						requireQuestionDuration={!!requireQuestionDuration}
						onStartGame={onStartGame}
					/>
				) : null}
				<PlayersCard members={members} viewerMemberId={viewerMemberId} />
			</div>

			<div className='fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-white/92 backdrop-blur'>
				<div className='mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-3 pb-4 sm:px-6'>
					{isHost ? (
						<>
							{onTerminateRoom ? (
								<TextButton
									type='button'
									tone='coral'
									disabled={terminatePending}
									onClick={onTerminateRoom}
								>
									{t('multiplayer.lobby.closeRoom')}
								</TextButton>
							) : null}
							{onStartGame ? (
								<Button
									type='submit'
									form={gameConfigFormId}
									size='lg'
									className='min-w-0 flex-1 sm:flex-none sm:px-10'
									pending={startPending}
								>
									{startPending ? null : (
										<Play aria-hidden='true' fill='currentColor' />
									)}
									{t('multiplayer.lobby.startGame')}
								</Button>
							) : null}
						</>
					) : (
						<p className='flex w-full items-center justify-center gap-2.5 py-3 text-base font-extrabold text-muted'>
							<LoaderCircle
								aria-hidden='true'
								className='size-5 animate-spin'
								strokeWidth={2.75}
							/>
							{t('multiplayer.lobby.waitingForHost')}
						</p>
					)}
				</div>
			</div>
		</PageShell>
	)
}
