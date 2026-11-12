import { z } from 'zod'

import { GAME_DIFFICULTIES, GAME_SCOPES } from '@georally/game-domain'

export const difficultySchema = z.enum(GAME_DIFFICULTIES)
export const scopeSchema = z.enum(GAME_SCOPES)
export const roomCodeSchema = z
	.string()
	.trim()
	.length(6)
	.transform(value => value.toUpperCase())

export const createRoomRequestSchema = z.object({
	hostName: z.string().trim().min(1).max(20),
	roomMode: z.enum(['classroom', 'group']),
})

export const lookupRoomRequestSchema = z.object({
	roomCode: roomCodeSchema,
})

export const joinRoomRequestSchema = z.object({
	roomCode: roomCodeSchema,
	memberName: z.string().trim().min(1).max(20),
})

export const resumeHostRoomRequestSchema = z.object({
	memberSessionToken: z.string().min(1),
})

export const resumePlayerRoomRequestSchema = z.object({
	memberSessionToken: z.string().min(1),
})

export const returnToLobbyRequestSchema = z.object({})
export const terminateRoomRequestSchema = z.object({})

export const startGameRequestSchema = z.object({
	gameConfig: z.object({
		questionCount: z.number().int().min(1).max(50),
		difficulty: difficultySchema,
		scope: scopeSchema,
		questionDurationMs: z.number().int().min(5_000).max(120_000).optional(),
	}),
})

export const revealRoundRequestSchema = z.object({})
export const advanceRoundRequestSchema = z.object({})

export const submitAnswerRequestSchema = z.object({
	countryId: z.string().regex(/^\d{3}$/),
})

export const FEEDBACK_CATEGORIES = ['bug', 'idea', 'map_data', 'other'] as const
export const FEEDBACK_REACTIONS = ['negative', 'neutral', 'positive'] as const

export const feedbackRequestSchema = z.object({
	category: z.enum(FEEDBACK_CATEGORIES),
	message: z.string().trim().min(3).max(2_000),
	contact: z.string().trim().max(200).optional(),
	reaction: z.enum(FEEDBACK_REACTIONS).optional(),
	context: z.object({
		locale: z.string().trim().min(1).max(16),
		path: z.string().trim().min(1).max(200),
		countryId: z
			.string()
			.regex(/^\d{3}$/)
			.optional(),
		appVersion: z.string().trim().max(40).optional(),
	}),
	honeypot: z.string().max(200).optional(),
})

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]
export type FeedbackReaction = (typeof FEEDBACK_REACTIONS)[number]
export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>

export type CreateRoomRequest = z.infer<typeof createRoomRequestSchema>
export type LookupRoomRequest = z.infer<typeof lookupRoomRequestSchema>
export type JoinRoomRequest = z.infer<typeof joinRoomRequestSchema>
export type ResumeHostRoomRequest = z.infer<typeof resumeHostRoomRequestSchema>
export type ResumePlayerRoomRequest = z.infer<
	typeof resumePlayerRoomRequestSchema
>
export type ReturnToLobbyRequest = z.infer<typeof returnToLobbyRequestSchema>
export type TerminateRoomRequest = z.infer<typeof terminateRoomRequestSchema>
export type StartGameRequest = z.infer<typeof startGameRequestSchema>
export type RevealRoundRequest = z.infer<typeof revealRoundRequestSchema>
export type AdvanceRoundRequest = z.infer<typeof advanceRoundRequestSchema>
export type SubmitAnswerRequest = z.infer<typeof submitAnswerRequestSchema>
