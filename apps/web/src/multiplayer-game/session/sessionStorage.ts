import type { RoomSession } from './types'

const STORAGE_KEY = 'georally.multiplayer.sessions'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

type RoomSessionsRecord = Record<string, RoomSession>

function isFreshSession(session: RoomSession, now: number): boolean {
	return (
		typeof session.savedAt === 'number' &&
		Number.isFinite(session.savedAt) &&
		now - session.savedAt <= SESSION_TTL_MS
	)
}

function readStore(): RoomSessionsRecord {
	try {
		const rawValue = localStorage.getItem(STORAGE_KEY)
		if (!rawValue) {
			return {}
		}

		const parsed = JSON.parse(rawValue) as RoomSessionsRecord
		if (!parsed || typeof parsed !== 'object') {
			return {}
		}

		const now = Date.now()
		const freshEntries = Object.entries(parsed).filter(([, session]) =>
			isFreshSession(session, now),
		)
		const store = Object.fromEntries(freshEntries) as RoomSessionsRecord

		if (freshEntries.length !== Object.keys(parsed).length) {
			writeStore(store)
		}

		return store
	} catch {
		return {}
	}
}

function writeStore(store: RoomSessionsRecord): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function getSessionKey(code: string, role: RoomSession['role']) {
	return `${role}:${code.trim().toUpperCase()}`
}

export function loadRoomSession(
	roomCode: string,
	role: RoomSession['role'],
): RoomSession | null {
	const store = readStore()
	const sessionKey = getSessionKey(roomCode, role)
	return store[sessionKey] ?? null
}

export function saveRoomSession(session: RoomSession): void {
	const store = readStore()
	const sessionKey = getSessionKey(session.roomCode, session.role)
	store[sessionKey] = session
	writeStore(store)
}

export function clearRoomSession(
	roomCode: string,
	role: RoomSession['role'],
): void {
	const store = readStore()
	const sessionKey = getSessionKey(roomCode, role)
	delete store[sessionKey]
	writeStore(store)
}
