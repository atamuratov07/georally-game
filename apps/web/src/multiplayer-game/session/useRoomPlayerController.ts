import type { RoomPlayerView } from '@georally/game-domain/multiplayer'
import type { LookupRoomFoundResponse } from '@georally/game-protocol'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatGatewayErrorMessage } from '../api/errors'
import { createSocketGateway } from '../api/socketGateway'
import {
	clearRoomSession,
	loadRoomSession,
	saveRoomSession,
} from './sessionStorage'
import type { RoomSession } from './types'
import { useActionStatus } from './useActionStatus'
import {
	useRoomRuntime,
	type RoomRuntimeAdapter,
	type RoomRuntimeState,
} from './useRoomRuntime'
import { i18n } from '../../shared/i18n/setup'
import { trackRoomJoined } from '../../shared/analytics/track'
import { useMultiplayerGameAnalytics } from '../../shared/analytics/useMultiplayerGameAnalytics'
import { lookupRoom } from '../api/roomsApi'

type RoomPlayerEntryState =
	| {
			status: 'connecting'
			roomCode: string
			step: 'lookup' | 'resume'
	  }
	| {
			status: 'idle'
			roomCode: string
			roomInfo: LookupRoomFoundResponse
			resumeMessage: string | null
	  }
	| {
			status: 'error'
			roomCode: string
			message: string
	  }

type RoomPlayerControllerState =
	RoomPlayerEntryState | RoomRuntimeState<RoomPlayerView>

type RoomPlayerAction = 'join' | 'submit'

interface UseRoomPlayerControllerResult {
	state: RoomPlayerControllerState
	actionPending: RoomPlayerAction | null
	actionErrorMessage: string | null
	joinRoom: (playerName: string) => Promise<void>
	submitAnswer: (countryId: string) => Promise<void>
	retry: () => Promise<void>
}

export function useRoomPlayerController(
	roomCode: string,
): UseRoomPlayerControllerResult {
	const gateway = useMemo(() => createSocketGateway(), [])

	const playerConnectionPort = useMemo(
		(): RoomRuntimeAdapter<RoomPlayerView> => ({
			resume: session =>
				gateway.resumePlayerRoom({
					memberSessionToken: session.memberSessionToken,
				}),
			subscribe: ({ onRoomClosed, onRoomSnapshot, onSocketDisconnect }) =>
				gateway.subscribePlayerRoom({
					onRoomSnapshot,
					onRoomClosed,
					onSocketDisconnect,
				}),
			close: () => gateway.disconnect(),
		}),
		[gateway],
	)
	const runtime = useRoomRuntime({
		adapter: playerConnectionPort,
		roomCode,
	})

	const [entryState, setEntryState] = useState<RoomPlayerEntryState>({
		status: 'connecting',
		roomCode,
		step: 'lookup',
	})
	const { actionPending, actionErrorMessage, clearActionError, runAction } =
		useActionStatus<RoomPlayerAction>()

	const [runtimeStarted, setRuntimeStarted] = useState(false)
	useMultiplayerGameAnalytics(
		runtimeStarted && runtime.state.status === 'ready'
			? runtime.state.room
			: null,
	)
	const state = runtimeStarted ? runtime.state : entryState

	const entryRunIdRef = useRef(0)

	const beginEntryRun = useCallback(() => {
		return ++entryRunIdRef.current
	}, [])

	const isActiveEntryRun = useCallback((runId: number) => {
		return entryRunIdRef.current === runId
	}, [])

	const cleanupController = useCallback(() => {
		entryRunIdRef.current++
		runtime.disconnect()
	}, [runtime.disconnect])

	const joinRoom = useCallback(
		async (playerName: string) => {
			if (state.status !== 'idle') {
				return
			}

			await runAction('join', async () => {
				const response = await gateway.joinRoom({
					roomCode,
					memberName: playerName.trim(),
				})
				const session: RoomSession = {
					roomId: response.roomId,
					roomCode: response.roomCode,
					role: response.role,
					memberId: response.memberId,
					memberSessionToken: response.memberSessionToken,
					savedAt: Date.now(),
				}

				runtime.acceptSession(session, response.snapshot)
				trackRoomJoined(response.snapshot.roomMode)
				saveRoomSession(session)
				setRuntimeStarted(true)
			})
		},
		[gateway, roomCode, runAction, runtime.acceptSession, state.status],
	)

	const submitAnswer = useCallback(
		async (countryId: string) => {
			if (runtime.state.status !== 'ready') {
				return
			}

			await runAction('submit', async () => {
				await gateway.submitAnswer({ countryId })
			})
		},
		[gateway, runAction, runtime.state.status],
	)

	const showJoinScreen = useCallback(
		(
			roomInfo: LookupRoomFoundResponse,
			resumeMessage: string | null = null,
		) => {
			setRuntimeStarted(false)
			setEntryState({
				status: 'idle',
				roomCode,
				roomInfo,
				resumeMessage,
			})
		},
		[roomCode],
	)

	const bootstrap = useCallback(async () => {
		const runId = beginEntryRun()
		setRuntimeStarted(false)
		clearActionError()

		if (roomCode.length !== 6) {
			setEntryState({
				status: 'error',
				roomCode,
				message: i18n.t('multiplayer.error.roomCodeLength'),
			})
			return
		}

		setEntryState({
			status: 'connecting',
			roomCode,
			step: 'lookup',
		})

		try {
			const lookupResponse = await lookupRoom({ roomCode })
			if (!isActiveEntryRun(runId)) {
				return
			}

			if (!lookupResponse.exists) {
				clearRoomSession(roomCode, 'player')
				setEntryState({
					status: 'error',
					roomCode,
					message: i18n.t('gatewayErrors.room_not_found'),
				})
				return
			}

			const storedSession = loadRoomSession(roomCode, 'player')
			if (!storedSession) {
				showJoinScreen(lookupResponse)
				return
			}

			setEntryState({
				status: 'connecting',
				roomCode,
				step: 'resume',
			})

			const result = await runtime.connect(storedSession)
			if (!isActiveEntryRun(runId)) {
				return
			}

			switch (result.kind) {
				case 'connected':
					saveRoomSession(result.session)
					setRuntimeStarted(true)
					return
				case 'rejected':
					clearRoomSession(roomCode, 'player')
					showJoinScreen(
						lookupResponse,
						i18n.t('multiplayer.error.playerSessionExpired'),
					)
					return
				case 'error':
					setRuntimeStarted(true)
					return
				case 'aborted':
					return
			}
		} catch (error) {
			if (!isActiveEntryRun(runId)) {
				return
			}

			setEntryState({
				status: 'error',
				roomCode,
				message: formatGatewayErrorMessage(error),
			})
		}
	}, [
		beginEntryRun,
		clearActionError,
		runtime.connect,
		gateway,
		isActiveEntryRun,
		roomCode,
		showJoinScreen,
	])

	useEffect(() => {
		void bootstrap()
		return () => {
			cleanupController()
		}
	}, [bootstrap, cleanupController])

	useEffect(() => {
		if (runtime.state.status === 'closed') {
			clearRoomSession(roomCode, 'player')
		}
	}, [roomCode, runtime.state.status])

	const retry = useCallback(async () => {
		await bootstrap()
	}, [bootstrap])

	return {
		state,
		actionPending,
		actionErrorMessage,
		joinRoom,
		submitAnswer,
		retry,
	}
}
