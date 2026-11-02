import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useRoomPlayerController } from '../session/useRoomPlayerController'
import { RoomFinishedScreen } from '../finished/RoomFinishedScreen'
import { PlayerJoinScreen } from '../join/PlayerJoinScreen'
import { RoomLobbyScreen } from '../lobby/RoomLobbyScreen'
import { RoomClosedScreen } from '../screens/RoomClosedScreen'
import { RoomErrorScreen } from '../screens/RoomErrorScreen'
import { RoomLoadingScreen } from '../screens/RoomLoadingScreen'
import { getMembersById } from '../model/roomSelectors'

import { AnimatePresence } from 'motion/react'
import { FloatingNotice } from '@/shared/ui'
import { Check, LoaderCircle } from 'lucide-react'

const loadParticipantScreen = () =>
	import('../game/ActiveGameParticipantScreen').then(module => ({
		default: module.ActiveGameParticipantScreen,
	}))

const ActiveGameParticipantScreen = lazy(loadParticipantScreen)

function HostConnectionNotice({ hostConnected }: { hostConnected?: boolean }) {
	const { t } = useTranslation()
	const [notice, setNotice] = useState<'disconnected' | 'reconnected' | null>(
		null,
	)
	const prevHostConnected = useRef<boolean | undefined>(undefined)

	useEffect(() => {
		if (!hostConnected) {
			setNotice('disconnected')
		} else if (prevHostConnected.current === false) {
			setNotice('reconnected')
			const timer = setTimeout(() => {
				setNotice(null)
			}, 1500)

			return () => clearTimeout(timer)
		} else {
			setNotice(null)
		}

		prevHostConnected.current = hostConnected
	}, [hostConnected])

	return (
		<AnimatePresence>
			{notice === 'reconnected' ? (
				<FloatingNotice key='reconnected' icon={<Check />}>
					{t('multiplayer.game.hostReconnected')}
				</FloatingNotice>
			) : null}
			{notice === 'disconnected' ? (
				<FloatingNotice
					key='disconnected'
					tone='error'
					icon={<LoaderCircle className='animate-spin' />}
				>
					{t('multiplayer.game.hostDisconnected')}
				</FloatingNotice>
			) : null}
		</AnimatePresence>
	)
}

export default function RoomPlayerPage() {
	const { t } = useTranslation()
	const params = useParams<{ roomCode: string }>()
	const roomCode = (params.roomCode ?? '').trim().toUpperCase()
	const {
		state,
		actionPending,
		actionErrorMessage,
		joinRoom,
		submitAnswer,
		retry,
	} = useRoomPlayerController(roomCode)

	useEffect(() => {
		if (state.status !== 'ready' || state.room.phase !== 'lobby') {
			return
		}

		void loadParticipantScreen()
	}, [state])

	if (state.status === 'connecting') {
		return <RoomLoadingScreen title={t('multiplayer.loading.connecting')} />
	}

	if (state.status === 'closed') {
		return <RoomClosedScreen reason={state.reason} />
	}

	if (state.status === 'error') {
		return (
			<RoomErrorScreen
				message={state.message}
				onRetry={() => {
					void retry()
				}}
			/>
		)
	}

	if (state.status === 'idle') {
		return (
			<PlayerJoinScreen
				hostName={state.roomInfo.hostName}
				joinable={state.roomInfo.joinable}
				pending={actionPending === 'join'}
				submitError={actionErrorMessage}
				resumeMessage={state.resumeMessage}
				onJoin={joinRoom}
			/>
		)
	}

	const room = state.room
	const isReconnecting = state.status === 'reconnecting'

	if (!room) {
		return <RoomLoadingScreen title={t('multiplayer.loading.reconnecting')} />
	}

	const hostConnected = getMembersById(room.members).get(
		room.hostId,
	)?.connected

	const renderHostConnectionStatus =
		room.roomMode === 'classroom' ? (
			<HostConnectionNotice hostConnected={hostConnected} />
		) : null

	if (room.phase === 'lobby') {
		return (
			<>
				{renderHostConnectionStatus}

				<RoomLobbyScreen
					role='player'
					roomCode={roomCode}
					roomMode={room.roomMode}
					viewerMemberId={room.viewerMemberId}
					members={room.members}
					actionErrorMessage={actionErrorMessage}
					isReconnecting={isReconnecting}
				/>
			</>
		)
	}

	if (room.phase === 'finished') {
		return (
			<>
				{renderHostConnectionStatus}

				<RoomFinishedScreen
					room={room}
					capabilities={{
						canPlayAgain: false,
						canTerminateRoom: false,
						canLeaveRoom: true,
					}}
					isReconnecting={isReconnecting}
				/>
			</>
		)
	}
	const gameLoadingFallback = (
		<RoomLoadingScreen title={t('multiplayer.loading.starting')} />
	)

	return (
		<div className='fixed inset-0 overflow-hidden bg-slate-950'>
			{renderHostConnectionStatus}

			<Suspense fallback={gameLoadingFallback}>
				<ActiveGameParticipantScreen
					game={room.activeGame}
					members={room.members}
					showCountryInfo={room.roomMode === 'classroom'}
					submitPending={actionPending === 'submit'}
					actionErrorMessage={actionErrorMessage}
					isReconnecting={isReconnecting}
					onSubmitAnswer={submitAnswer}
				/>
			</Suspense>
		</div>
	)
}
