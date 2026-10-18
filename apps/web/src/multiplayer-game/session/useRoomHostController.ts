import type {
	GameConfig,
	RoomHostView,
} from '@georally/game-domain/multiplayer'
import { composeHostRoomView } from '@georally/game-domain/multiplayer/room'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createSocketGateway, type SocketGateway } from '../api/socketGateway'
import { clearRoomGameConfig } from '../model/gameConfig'
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
import { trackMultiplayerGameStart } from '../../shared/analytics/track'
import { useMultiplayerGameAnalytics } from '../../shared/analytics/useMultiplayerGameAnalytics'

type RoomHostControllerState = RoomRuntimeState<RoomHostView>
type RoomHostAction = 'start' | 'return-lobby' | 'terminate-room'

interface UseRoomHostControllerResult<TAction> {
	state: RoomHostControllerState
	gateway: SocketGateway
	actionPending: RoomHostAction | TAction | null
	actionErrorMessage: string | null
	startGame: (config: GameConfig) => Promise<void>
	returnToLobby: () => Promise<void>
	terminateRoom: () => Promise<void>
	runAction: (
		action: RoomHostAction | TAction,
		task: () => Promise<void>,
	) => Promise<void>
	retry: () => Promise<void>
}

export function useRoomHostController<TAction extends string>(
	roomCode: string,
): UseRoomHostControllerResult<TAction> {
	const gateway = useMemo(() => createSocketGateway(), [])
	const hostConnectionPort = useMemo(
		(): RoomRuntimeAdapter<RoomHostView> => ({
			resume: (session: RoomSession) =>
				gateway.resumeHostRoom({
					memberSessionToken: session.memberSessionToken,
				}),
			compose: composeHostRoomView,
			subscribe: handlers => gateway.subscribeRoom(handlers),
			close: () => gateway.disconnect(),
		}),
		[gateway],
	)
	const runtime = useRoomRuntime({
		roomCode,
		adapter: hostConnectionPort,
	})

	const [entryErrorMessage, setEntryErrorMessage] = useState<string | null>(
		null,
	)
	const { actionPending, actionErrorMessage, clearActionError, runAction } =
		useActionStatus<RoomHostAction | TAction>()

	const state = useMemo<RoomHostControllerState>(() => {
		if (entryErrorMessage) {
			return {
				status: 'error',
				roomCode,
				message: entryErrorMessage,
			}
		}

		return runtime.state
	}, [entryErrorMessage, roomCode, runtime.state])

	useMultiplayerGameAnalytics(state.status === 'ready' ? state.room : null)

	const bootstrap = useCallback(async () => {
		setEntryErrorMessage(null)
		clearActionError()

		if (roomCode.length !== 6) {
			setEntryErrorMessage(i18n.t('multiplayer.error.roomCodeLength'))
			return
		}

		const storedSession = loadRoomSession(roomCode, 'host')
		if (!storedSession) {
			setEntryErrorMessage(i18n.t('multiplayer.error.hostSessionMissing'))
			return
		}

		const result = await runtime.connect(storedSession)
		switch (result.kind) {
			case 'connected':
				saveRoomSession(result.session)
				return
			case 'rejected':
				clearRoomSession(roomCode, 'host')
				setEntryErrorMessage(i18n.t('multiplayer.error.hostSessionExpired'))
				return
			case 'error':
			case 'aborted':
				return
		}
	}, [clearActionError, runtime.connect, roomCode])

	const startGame = useCallback(
		async (gameConfig: GameConfig) => {
			if (runtime.state.status !== 'ready') {
				return
			}

			const { roomMode, connectedMemberCount } = runtime.state.room

			await runAction('start', async () => {
				await gateway.startGame({ gameConfig })
				trackMultiplayerGameStart({
					roomMode,
					difficulty: gameConfig.difficulty,
					scope: gameConfig.scope,
					questionCount: gameConfig.questionCount,
					questionDurationMs: gameConfig.questionDurationMs,
					memberCountAtStart: connectedMemberCount,
				})
			})
		},
		[gateway, runAction, runtime.state],
	)

	const returnToLobby = useCallback(async () => {
		if (runtime.state.status !== 'ready') {
			return
		}

		await runAction('return-lobby', async () => {
			await gateway.returnToLobby({})
		})
	}, [gateway, runAction, runtime.state.status])

	const terminateRoom = useCallback(async () => {
		if (runtime.state.status !== 'ready') {
			return
		}

		await runAction('terminate-room', async () => {
			await gateway.terminateRoom({})
		})
	}, [gateway, runAction, runtime.state.status])

	useEffect(() => {
		void bootstrap()
		return () => {
			runtime.disconnect()
		}
	}, [bootstrap, runtime.disconnect])

	useEffect(() => {
		if (runtime.state.status === 'closed') {
			clearRoomSession(roomCode, 'host')
			clearRoomGameConfig(roomCode)
		}
	}, [roomCode, runtime.state.status])

	const retry = useCallback(async () => {
		await bootstrap()
	}, [bootstrap])

	return {
		state,
		gateway,
		actionPending,
		actionErrorMessage,
		runAction,
		startGame,
		returnToLobby,
		terminateRoom,
		retry,
	}
}
