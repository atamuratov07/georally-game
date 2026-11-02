import { lazy, Suspense, useEffect, useRef } from 'react'
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

import { toast } from 'sonner'
import { PendingToastIcon } from '@/shared/ui/sonner'

const loadParticipantScreen = () =>
	import('../game/ActiveGameParticipantScreen').then(module => ({
		default: module.ActiveGameParticipantScreen,
	}))

const ActiveGameParticipantScreen = lazy(loadParticipantScreen)

const HOST_CONNECTION_TOAST_ID = 'host-connection'
const HOST_RECONNECTED_TOAST_ID = 'host-reconnected'

function HostConnectionNotice({ hostConnected }: { hostConnected?: boolean }) {
	const { t } = useTranslation()
	const wasDisconnected = useRef(false)

	useEffect(() => {
		if (!hostConnected) {
			wasDisconnected.current = true
			toast(t('multiplayer.game.hostDisconnected'), {
				id: HOST_CONNECTION_TOAST_ID,
				duration: Infinity,
				icon: <PendingToastIcon />,
			})
		} else if (wasDisconnected.current) {
			wasDisconnected.current = false
			toast.dismiss(HOST_CONNECTION_TOAST_ID)
			toast.success(t('multiplayer.game.hostReconnected'), {
				id: HOST_RECONNECTED_TOAST_ID,
				duration: 1500,
			})
		}
	}, [hostConnected, t])

	useEffect(() => {
		return () => {
			toast.dismiss(HOST_CONNECTION_TOAST_ID)
		}
	}, [])

	return null
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
