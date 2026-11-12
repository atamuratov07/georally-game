import type { FeedbackRequest } from '@georally/game-protocol'
import { buildApiUrl } from '@/shared/lib/apiUrl'

export type FeedbackResult = 'sent' | 'rate_limited' | 'failed'

const REQUEST_TIMEOUT_MS = 8_000

export async function sendFeedback(
	payload: FeedbackRequest,
): Promise<FeedbackResult> {
	try {
		const response = await fetch(buildApiUrl('/feedback'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		})
		if (response.ok) return 'sent'
		return response.status === 429 ? 'rate_limited' : 'failed'
	} catch {
		return 'failed'
	}
}
