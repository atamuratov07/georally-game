// A day is a local date key, 'YYYY-MM-DD'.
const DAY_MS = 24 * 60 * 60 * 1000

function toUtc(day: string): number {
	const [year, month, date] = day.split('-').map(Number)
	return Date.UTC(year, month - 1, date)
}

export function addDays(day: string, count: number): string {
	return new Date(toUtc(day) + count * DAY_MS).toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
	return Math.round((toUtc(to) - toUtc(from)) / DAY_MS)
}

export function weekday(day: string): number {
	return (new Date(toUtc(day)).getUTCDay() + 6) % 7 // 0 is Monday
}
