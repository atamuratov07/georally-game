import type { GameConfig } from '@georally/game-domain/multiplayer'
import type {
	RoomMemberRole,
	VisibleMemberInfo,
} from '@georally/game-domain/multiplayer/room'
import { DoorClosed, Play, UserRound } from 'lucide-react'
import { useMemo } from 'react'
import { AlertMessage, Button, CopyButton } from '../../shared/ui'
import { cn } from '../../shared/utils'
import { GameConfigPanel } from './GameConfigPanel'
import { LanguageSwitcher } from '../../shared/i18n'
import { useTranslation } from 'react-i18next'

interface RoomLobbyScreenProps {
	role: RoomMemberRole
	roomCode: string
	members: VisibleMemberInfo[]
	requireQuestionDuration?: boolean
	startPending?: boolean
	terminatePending?: boolean
	actionErrorMessage?: string | null
	isReconnecting?: boolean
	onStartGame?: (config: GameConfig) => void
	onTerminateRoom?: () => void
}

function InvitePanel({ roomCode }: { roomCode: string }) {
	const { t } = useTranslation()

	const inviteUrl = useMemo(() => {
		if (typeof window === 'undefined') {
			return `/multiplayer/room/${roomCode}`
		}

		return new URL(
			`/multiplayer/room/${roomCode}`,
			location.origin,
		).toString()
	}, [roomCode])

	return (
		<section
			aria-label={t('multiplayer.lobby.invite')}
			className='mx-auto mt-6 flex w-full max-w-2xl flex-col items-center gap-4 rounded-[28px] border border-white/70 bg-white/90 px-5 py-4 shadow-[0_18px_54px_rgba(15,23,42,0.12)] backdrop-blur sm:flex-row sm:justify-between'
		>
			<div className='text-center sm:text-left'>
				<p className='text-[10px] font-black uppercase tracking-[0.22em] text-slate-500'>
					{t('multiplayer.lobby.roomCode')}
				</p>
				<p className='mt-1 font-mono text-3xl font-black tracking-[0.2em] text-slate-950'>
					{roomCode}
				</p>
			</div>

			<div className='flex flex-wrap justify-center gap-2'>
				<CopyButton
					textToCopy={roomCode}
					title={t('multiplayer.lobby.copyCode')}
					is3d
					className='min-h-11 border-slate-200 py-2.5'
				>
					{t('multiplayer.lobby.copyCodeShort')}
				</CopyButton>
				<CopyButton
					textToCopy={inviteUrl}
					title={t('multiplayer.lobby.copyLink')}
					is3d
					className='min-h-11 border-slate-200 py-2.5'
				>
					{t('multiplayer.lobby.copyLinkShort')}
				</CopyButton>
			</div>
		</section>
	)
}

function MemberTile({ member }: { member: VisibleMemberInfo }) {
	return (
		<li className='flex min-w-0 flex-col items-center gap-3 text-center'>
			<div
				className={cn(
					'grid h-20 w-20 place-items-center rounded-full border-2 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.12)] sm:h-24 sm:w-24',
					member.connected
						? 'border-amber-300'
						: 'border-slate-200 opacity-55',
				)}
			>
				<UserRound
					aria-hidden='true'
					size={42}
					strokeWidth={2}
					className='text-slate-700'
				/>
			</div>
			<span className='block w-full truncate px-1 text-sm font-black text-slate-950 sm:text-base'>
				{member.name}
			</span>
		</li>
	)
}

export function RoomLobbyScreen({
	role,
	roomCode,
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
	const canStartGame = isHost && Boolean(onStartGame)
	const gameConfigFormId = `room-game-config-${roomCode}`

	return (
		<main
			className={cn(
				'fixed inset-0 overflow-y-auto px-5 py-6 text-slate-950 sm:px-8',
				canStartGame ? 'pb-24' : '',
			)}
		>
			<header className='relative mx-auto w-full max-w-6xl text-center'>
				<p className='text-[11px] font-black uppercase tracking-[0.24em] text-amber-600'>
					{t('multiplayer.lobby.title')}
				</p>
				<h1 className='mt-2 text-3xl font-black tracking-tight sm:text-4xl'>
					{isHost
						? t('multiplayer.lobby.hostHeading')
						: t('multiplayer.lobby.playerHeading')}
				</h1>

				{isReconnecting ? (
					<AlertMessage className='mx-auto mt-5 max-w-xl'>
						{t('multiplayer.lobby.reconnecting')}
					</AlertMessage>
				) : null}

				{actionErrorMessage ? (
					<AlertMessage tone='error' className='mx-auto mt-5 max-w-xl'>
						{actionErrorMessage}
					</AlertMessage>
				) : null}

				<InvitePanel roomCode={roomCode} />

				{isHost && onStartGame ? (
					<GameConfigPanel
						roomCode={roomCode}
						formId={gameConfigFormId}
						requireQuestionDuration={!!requireQuestionDuration}
						onStartGame={onStartGame}
					/>
				) : null}

				<LanguageSwitcher className='absolute top-0 right-0' />
			</header>

			<section
				aria-label={t('multiplayer.lobby.members')}
				className='mx-auto flex w-full max-w-6xl items-start justify-center py-8'
			>
				<ul className='grid w-full max-w-6xl grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
					{members.map(member => (
						<MemberTile key={member.memberId} member={member} />
					))}
				</ul>
			</section>

			{isHost && onTerminateRoom ? (
				<footer className='mx-auto mt-4 flex w-full max-w-6xl justify-center pb-8'>
					<Button
						type='button'
						variant='danger'
						size='pill'
						is3d
						disabled={terminatePending}
						onClick={onTerminateRoom}
					>
						<DoorClosed aria-hidden='true' size={16} strokeWidth={2.4} />
						{terminatePending
							? t('multiplayer.lobby.closingRoom')
							: t('multiplayer.lobby.closeRoom')}
					</Button>
				</footer>
			) : !isHost ? (
				<footer className='mx-auto flex w-full max-w-6xl justify-center pb-8'>
					<p className='rounded-full border border-slate-200 bg-white/90 px-5 py-3 text-sm font-black text-slate-700 shadow-[0_14px_36px_rgba(15,23,42,0.14)]'>
						{t('multiplayer.lobby.waitingForHost')}
					</p>
				</footer>
			) : null}

			{canStartGame ? (
				<div className='pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-5'>
					<Button
						type='submit'
						form={gameConfigFormId}
						size='lg'
						is3d
						disabled={startPending}
						className='pointer-events-auto min-w-48 px-8'
					>
						<Play
							aria-hidden='true'
							size={17}
							strokeWidth={2.8}
							fill='currentColor'
						/>
						{startPending
							? t('multiplayer.lobby.startingGame')
							: t('multiplayer.lobby.startGame')}
					</Button>
				</div>
			) : null}
		</main>
	)
}
