export interface LocalDay {
	key: string // 'YYYY-MM-DD'
	start: number // local midnight
	end: number // the next local midnight, so 23 or 25 hours on a clock change
}

function pad(value: number) {
	return String(value).padStart(2, '0')
}

export function localDayKey(now: number): string {
	const date = new Date(now)
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function localDay(now: number): LocalDay {
	const date = new Date(now)
	const year = date.getFullYear()
	const month = date.getMonth()
	const day = date.getDate()
	return {
		key: localDayKey(now),
		start: new Date(year, month, day).getTime(),
		end: new Date(year, month, day + 1).getTime(),
	}
}
