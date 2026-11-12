export interface TelegramTarget {
	botToken: string
	chatId: string
}

export type TelegramDelivery =
	| { ok: true }
	| {
			ok: false
			failure: 'rejected' | 'timeout' | 'network'
			status?: number
			description?: string
	  }

const SEND_TIMEOUT_MS = 5_000

export async function sendTelegramMessage(
	target: TelegramTarget,
	text: string,
): Promise<TelegramDelivery> {
	let response: Response
	try {
		response = await fetch(
			`https://api.telegram.org/bot${target.botToken}/sendMessage`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					chat_id: target.chatId,
					text,
					link_preview_options: { is_disabled: true },
				}),
				signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
			},
		)
	} catch (error) {
		const timedOut = error instanceof Error && error.name === 'TimeoutError'
		return { ok: false, failure: timedOut ? 'timeout' : 'network' }
	}

	if (response.ok) {
		return { ok: true }
	}

	const body: unknown = await response.json().catch(() => null)
	const description =
		body &&
		typeof body === 'object' &&
		'description' in body &&
		typeof body.description === 'string'
			? body.description
			: undefined

	return {
		ok: false,
		failure: 'rejected',
		status: response.status,
		description,
	}
}
