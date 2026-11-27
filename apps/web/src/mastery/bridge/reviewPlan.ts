import { localDay } from '@/shared/time/localDay'

export interface ReviewPlan {
	review: number
	fresh: number
}

// Null until the player starts review.
export async function loadReviewPlan(now: number): Promise<ReviewPlan | null> {
	try {
		const { mastery } = await import('../container')
		if ((await mastery.repository.loadMeta()).plan === null) return null
		const [{ loadToday, planCounts }, { playableCountryPool }] =
			await Promise.all([
				import('@georally/mastery'),
				import('@georally/country-catalog'),
			])
		const { cards, sessionPlan } = await loadToday(mastery, {
			pool: playableCountryPool,
			day: localDay(now),
		})
		return planCounts(cards, sessionPlan)
	} catch {
		return null
	}
}
