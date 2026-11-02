import { lazy, Suspense, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLocalizedNavigate } from '../../app/useLocalizedNavigate'

import { RoomFinishedScreen } from '../finished/RoomFinishedScreen'
import { RoomLobbyScreen } from '../lobby/RoomLobbyScreen'
import { RoomClosedScreen } from '../screens/RoomClosedScreen'
import { RoomErrorScreen } from '../screens/RoomErrorScreen'
import { RoomLoadingScreen } from '../screens/RoomLoadingScreen'

import { useRoomHostController } from '../session/useRoomHostController'
import { useGroupHostActions } from '../session/useGroupHostActions'
import { useClassroomHostActions } from '../session/useClassroomHostActions'

const loadParticipantScreen = () =>
	import('../game/ActiveGameParticipantScreen').then(module => ({
		default: module.ActiveGameParticipantScreen,
	}))

const loadHostScreen = () =>
	import('../game/ActiveGameHostScreen').then(module => ({
		default: module.ActiveGameHostScreen,
	}))

const ActiveGameParticipantScreen = lazy(loadParticipantScreen)
const ActiveGameHostScreen = lazy(loadHostScreen)

export default function RoomHostPage() {
	const { t } = useTranslation()
	const params = useParams<{ roomCode: string }>()
	const navigate = useLocalizedNavigate()
	const roomCode = (params.roomCode ?? '').trim().toUpperCase()
	const {
		state,
		gateway,
		actionPending,
		actionErrorMessage,
		runAction,
		startGame,
		returnToLobby,
		terminateRoom,
		retry,
	} = useRoomHostController(roomCode)

	const { submitAnswer } = useGroupHostActions({
		state,
		gateway,
		runAction,
	})
	const { revealRound, advanceRound } = useClassroomHostActions({
		state,
		gateway,
		runAction,
	})

	const closedReason = state.status === 'closed' ? state.reason : null

	useEffect(() => {
		if (closedReason === 'host_terminated') {
			navigate('/multiplayer', { replace: true })
		}
	}, [closedReason, navigate])

	useEffect(() => {
		if (state.status !== 'ready' || state.room.phase !== 'lobby') {
			return
		}

		if (state.room.roomMode === 'group') {
			void loadParticipantScreen()
		} else {
			void loadHostScreen()
		}
	}, [state])

	if (state.status === 'connecting') {
		return <RoomLoadingScreen title={t('multiplayer.loading.connecting')} />
	}

	if (state.status === 'closed') {
		if (state.reason === 'host_terminated') {
			return <RoomLoadingScreen title={t('multiplayer.loading.closed')} />
		}

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

	const room = state.room
	const isReconnecting = state.status === 'reconnecting'

	if (!room) {
		return <RoomLoadingScreen title={t('multiplayer.loading.reconnecting')} />
	}

	const requireQuestionDuration = room.roomMode === 'group'
	if (room.phase === 'lobby') {
		return (
			<RoomLobbyScreen
				role='host'
				roomCode={roomCode}
				roomMode={room.roomMode}
				viewerMemberId={room.viewerMemberId}
				requireQuestionDuration={requireQuestionDuration}
				members={room.members}
				startPending={actionPending === 'start'}
				terminatePending={actionPending === 'terminate-room'}
				actionErrorMessage={actionErrorMessage}
				isReconnecting={isReconnecting}
				onStartGame={gameConfig => {
					void startGame(gameConfig)
				}}
				onTerminateRoom={() => {
					void terminateRoom()
				}}
			/>
		)
	}

	if (room.phase === 'finished') {
		return (
			<RoomFinishedScreen
				room={room}
				capabilities={{
					canPlayAgain: true,
					canTerminateRoom: true,
					canLeaveRoom: false,
				}}
				isReconnecting={isReconnecting}
				playAgainPending={actionPending === 'return-lobby'}
				terminatePending={actionPending === 'terminate-room'}
				actionErrorMessage={actionErrorMessage}
				onPlayAgain={() => {
					void returnToLobby()
				}}
				onTerminateRoom={() => {
					void terminateRoom()
				}}
			/>
		)
	}

	const gameLoadingFallback = (
		<RoomLoadingScreen title={t('multiplayer.loading.starting')} />
	)

	if (room.roomMode === 'group') {
		return (
			<div className='fixed inset-0 overflow-hidden bg-slate-950'>
				<Suspense fallback={gameLoadingFallback}>
					<ActiveGameParticipantScreen
						game={room.activeGame}
						members={room.members}
						showCountryInfo={false}
						submitPending={actionPending === 'submit'}
						actionErrorMessage={actionErrorMessage}
						isReconnecting={isReconnecting}
						onSubmitAnswer={submitAnswer}
					/>
				</Suspense>
			</div>
		)
	}

	return (
		<Suspense fallback={gameLoadingFallback}>
			<ActiveGameHostScreen
				game={room.activeGame}
				members={room.members}
				onRevealRound={revealRound}
				onAdvanceRound={advanceRound}
				isReconnecting={isReconnecting}
				revealPending={actionPending === 'reveal'}
				advancePending={actionPending === 'advance'}
				actionErrorMessage={actionErrorMessage}
			/>
		</Suspense>
	)
}
