import {
	acceptMisses,
	applyCasualOutcomes,
	type CasualOutcome,
} from '@georally/mastery'
import { mastery } from '../container'

export type { CasualOutcome }

export interface ReviewOffer {
	count: number
	accept: () => Promise<void>
}

export async function reportCasualOutcomes(
	outcomes: readonly CasualOutcome[],
): Promise<ReviewOffer | null> {
	const offer = await applyCasualOutcomes(mastery, outcomes, Date.now())
	if (offer.length === 0) return null
	return {
		count: offer.length,
		accept: () =>
			acceptMisses(
				mastery,
				offer,
				crypto.getRandomValues(new Uint32Array(1))[0],
			),
	}
}
