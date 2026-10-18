let clockOffsetMs = 0

export function syncServerClock(serverNow: number): void {
	clockOffsetMs = serverNow - Date.now()
}

export function getServerNow(): number {
	return Date.now() + clockOffsetMs
}
