import type { Router } from 'express'
import type { EmptyAckData } from '@georally/game-protocol'
import { feedbackRequestSchema } from '@georally/game-protocol'

import { formatFeedbackMessage } from './message.js'
import { sendTelegramMessage, type TelegramTarget } from './telegram.js'
import { respondWithError, respondWithSuccess } from '../../http/responses.js'
import type { Logger } from '../../observability/logger.js'
import type { ProtocolErrorReporter } from '../../observability/protocolErrors.js'

export interface RegisterFeedbackRoutesOptions {
	router: Router
	telegram: TelegramTarget | null
	logger: Logger
	reportProtocolError: ProtocolErrorReporter
}

export function registerFeedbackRoutes({
	router,
	telegram,
	logger,
	reportProtocolError,
}: RegisterFeedbackRoutesOptions): void {
	router.post('/feedback', async (request, response) => {
		const parsed = feedbackRequestSchema.safeParse(request.body)
		if (!parsed.success) {
			reportProtocolError('http_error', { code: 'invalid_payload' })
			return respondWithError(response, { code: 'invalid_payload' })
		}

		const feedback = parsed.data
		if (feedback.honeypot) {
			logger.info({ reason: 'honeypot' }, 'feedback_dropped')
			return respondWithSuccess<EmptyAckData>(response, 201, {})
		}

		if (!telegram) {
			return respondWithError(response, { code: 'feedback_unavailable' })
		}

		const delivery = await sendTelegramMessage(
			telegram,
			formatFeedbackMessage(feedback, request.get('user-agent')),
		)
		if (!delivery.ok) {
			logger.error(
				{
					failure: delivery.failure,
					status: delivery.status,
					description: delivery.description,
				},
				'feedback_delivery_failed',
			)
			return respondWithError(response, { code: 'feedback_unavailable' })
		}

		logger.info(
			{
				category: feedback.category,
				reaction: feedback.reaction,
				locale: feedback.context.locale,
				messageLength: feedback.message.length,
				hasContact: Boolean(feedback.contact),
			},
			'feedback_sent',
		)
		respondWithSuccess<EmptyAckData>(response, 201, {})
	})
}
