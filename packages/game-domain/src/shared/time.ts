export function elapsedSeconds(start: number, end: number): number {
	return Math.max(0, Math.floor((end - start) / 1000))
}

export interface LocalDay {
	key: string // 'YYYY-MM-DD' in the player's time zone
	start: number // local midnight
	end: number // the next local midnight
}
