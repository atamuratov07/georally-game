import {
	applyRoomSyncHostDetailUpdate,
	applyRoomSyncUpdate,
	applyRoomSyncViewerUpdate,
	createRoomSyncState,
	type MemberId,
	type RoomCode,
	type RoomMode,
	type RoomPhase,
	type RoomSync,
	type RoomSyncState,
} from '@georally/game-domain/multiplayer/room'
import type {
	ResumeRoomResponse,
	RoomClosedEvent,
} from '@georally/game-protocol'
import { useCallback, useEffect, useRef, useState } from 'react'
import { formatGatewayErrorMessage, toGatewayError } from '../api/errors'
import type { RoomSubscriptionHandlers } from '../api/socketGateway'
import type { RoomSession } from './types'
import { i18n } from '../../shared/i18n/setup'
import { trackRoomClosed } from '../../shared/analytics/track'

export type RoomRuntimeState<TView> =
	| {
			status: 'connecting'
			roomCode: RoomCode
	  }
	| {
			status: 'ready'
			roomCode: RoomCode
			session: RoomSession
			room: TView
	  }
	| {
			status: 'reconnecting'
			roomCode: RoomCode
			session: RoomSession
			room: TView | null
	  }
	| {
			status: 'closed'
			roomCode: RoomCode
			session: RoomSession | null
			room: TView | null
			reason: RoomClosedEvent['reason']
	  }
	| {
			status: 'error'
			roomCode: RoomCode
			message: string
	  }

export type RoomRuntimeAdapter<TView> = {
	resume: (session: RoomSession) => Promise<ResumeRoomResponse>
	compose: (sync: RoomSync, memberId: MemberId) => TView | undefined
	subscribe: (handlers: Required<RoomSubscriptionHandlers>) => () => void
	close: () => void
}

export type ConnectRoomSessionResult =
	| { kind: 'connected'; session: RoomSession }
	| { kind: 'rejected' }
	| { kind: 'error' }
	| { kind: 'aborted' }

interface UseRoomRuntimeOptions<TView> {
	roomCode: RoomCode
	adapter: RoomRuntimeAdapter<TView>
}

interface UseRoomRuntimeResult<TView> {
	state: RoomRuntimeState<TView>
	connect: (
		session: RoomSession,
		mode?: 'connecting' | 'reconnecting',
	) => Promise<ConnectRoomSessionResult>
	acceptSession: (session: RoomSession, sync: RoomSync) => void
	disconnect: () => void
}

function isRejectedSessionError(error: unknown): boolean {
	const gatewayError = toGatewayError(error)
	return (
		gatewayError.code === 'member_session_not_found' ||
		gatewayError.code === 'unauthorized'
	)
}

type RoomAnalyticsFields = {
	roomMode: RoomMode
	phase: RoomPhase
	connectedMemberCount: number
}

export function useRoomRuntime<TView extends RoomAnalyticsFields>({
	roomCode,
	adapter,
}: UseRoomRuntimeOptions<TView>): UseRoomRuntimeResult<TView> {
	const [state, setState] = useState<RoomRuntimeState<TView>>({
		status: 'connecting',
		roomCode,
	})
	const roomRef = useRef<TView | null>(null)
	const syncRef = useRef<RoomSyncState | null>(null)
	const unsubscribeRef = useRef<(() => void) | null>(null)
	const requestRunIdRef = useRef(0)
	const reconnectRef = useRef<
		(
			session: RoomSession,
			mode?: 'connecting' | 'reconnecting',
		) => Promise<ConnectRoomSessionResult>
	>(async () => ({ kind: 'aborted' }))

	const beginRun = useCallback(() => {
		return ++requestRunIdRef.current
	}, [])

	const isActiveRun = useCallback((runId: number): boolean => {
		return requestRunIdRef.current === runId
	}, [])

	const clearSubscriptions = useCallback(() => {
		unsubscribeRef.current?.()
		unsubscribeRef.current = null
	}, [])

	const stopConnection = useCallback(() => {
		requestRunIdRef.current++
		clearSubscriptions()
	}, [clearSubscriptions])

	const disconnect = useCallback(() => {
		stopConnection()
		adapter.close()
		roomRef.current = null
		syncRef.current = null
	}, [adapter, stopConnection])

	const attachSession = useCallback(
		(session: RoomSession, sync: RoomSync) => {
			if (session.roomCode !== roomCode) {
				throw new Error('Cannot attach a session for a different room.')
			}

			clearSubscriptions()

			const room = adapter.compose(sync, session.memberId)
			if (!room) {
				throw new Error('The room state from the server is incomplete.')
			}

			syncRef.current = createRoomSyncState(sync)
			roomRef.current = room

			setState({
				status: 'ready',
				roomCode,
				session,
				room,
			})

			const applySyncState = (next: RoomSyncState) => {
				const current = syncRef.current
				syncRef.current = next
				if (next.outOfSync) {
					void reconnectRef.current(session, 'reconnecting')
					return
				}
				if (next.sync === current?.sync) {
					return
				}

				const nextRoom = adapter.compose(next.sync, session.memberId)
				if (!nextRoom) {
					syncRef.current = { ...next, outOfSync: true }
					void reconnectRef.current(session, 'reconnecting')
					return
				}

				roomRef.current = nextRoom
				setState({
					status: 'ready',
					roomCode,
					session,
					room: nextRoom,
				})
			}

			const getSyncState = (roomId: string) => {
				const current = syncRef.current
				return roomId === session.roomId && current && !current.outOfSync
					? current
					: null
			}

			unsubscribeRef.current = adapter.subscribe({
				onRoomUpdate: payload => {
					const current = getSyncState(payload.roomId)
					if (current) {
						applySyncState(applyRoomSyncUpdate(current, payload))
					}
				},
				onRoomViewer: payload => {
					const current = getSyncState(payload.roomId)
					if (current) {
						syncRef.current = applyRoomSyncViewerUpdate(current, payload)
					}
				},
				onRoomHostDetail: payload => {
					const current = getSyncState(payload.roomId)
					if (current) {
						syncRef.current = applyRoomSyncHostDetailUpdate(
							current,
							payload,
						)
					}
				},
				onRoomClosed: payload => {
					if (payload.roomId !== session.roomId) {
						return
					}

					// Analytics
					trackRoomClosed({
						reason: payload.reason,
						roomMode: roomRef.current?.roomMode,
						role: session.role === 'host' ? 'host' : 'player',
						phaseAtClose: roomRef.current?.phase,
						memberCountAtClose: roomRef.current?.connectedMemberCount,
					})
					// Analytics end

					stopConnection()
					setState({
						status: 'closed',
						roomCode,
						session,
						room: roomRef.current,
						reason: payload.reason,
					})
					setTimeout(() => {
						adapter.close()
					}, 0)
				},
				onSocketDisconnect: reason => {
					if (reason === 'io server disconnect') {
						stopConnection()
						setState({
							status: 'error',
							roomCode,
							message: i18n.t(
								'multiplayer.error.sessionOpenedElsewhere',
							),
						})
						return
					}

					setState({
						status: 'reconnecting',
						roomCode,
						session,
						room: roomRef.current,
					})
				},

				onSocketReconnect: () => {
					void reconnectRef.current(session, 'reconnecting')
				},
			})
		},
		[clearSubscriptions, adapter, roomCode, stopConnection],
	)

	const connect = useCallback(
		async (
			session: RoomSession,
			mode: 'connecting' | 'reconnecting' = 'connecting',
		): Promise<ConnectRoomSessionResult> => {
			const runId = beginRun()

			if (mode === 'reconnecting') {
				setState({
					status: 'reconnecting',
					roomCode,
					session,
					room: roomRef.current,
				})
			} else {
				setState({
					status: 'connecting',
					roomCode,
				})
			}

			try {
				const response = await adapter.resume(session)
				if (!isActiveRun(runId)) {
					return { kind: 'aborted' }
				}

				const nextSession: RoomSession = {
					...session,
					roomId: response.roomId,
					roomCode,
					memberId: response.memberId,
					savedAt: Date.now(),
				}

				attachSession(nextSession, response.sync)
				return { kind: 'connected', session: nextSession }
			} catch (error) {
				if (!isActiveRun(runId)) {
					return { kind: 'aborted' }
				}

				if (isRejectedSessionError(error)) {
					disconnect()
					if (mode === 'reconnecting') {
						setState({
							status: 'error',
							roomCode,
							message: i18n.t('multiplayer.error.roomSessionExpired'),
						})
					}
					return { kind: 'rejected' }
				}

				setState({
					status: 'error',
					roomCode,
					message: formatGatewayErrorMessage(error),
				})
				return { kind: 'error' }
			}
		},
		[attachSession, beginRun, disconnect, isActiveRun, adapter, roomCode],
	)

	useEffect(() => {
		reconnectRef.current = connect
	}, [connect])

	useEffect(() => {
		return () => {
			disconnect()
		}
	}, [disconnect])

	return {
		state,
		connect,
		acceptSession: attachSession,
		disconnect,
	}
}
