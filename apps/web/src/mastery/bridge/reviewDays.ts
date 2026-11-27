import { localDayKey } from '@/shared/time/localDay'

export async function loadReviewDays(): Promise<string[]> {
	try {
		const { mastery } = await import('../container')
		const times = await mastery.repository.loadReviewTimes()
		return [...new Set(times.map(localDayKey))]
	} catch {
		return []
	}
}
