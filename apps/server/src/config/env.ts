import { z } from 'zod'

import { LOG_LEVELS, type LogLevel } from '../observability/logger.js'

const envSchema = z.object({
	PORT: z.coerce.number().int().positive().default(3001),
	HOST: z.string().min(1).default('0.0.0.0'),
	CORS_ORIGIN: z.string().default('http://localhost:5173'),
	LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
	REVEAL_DURATION_MS: z.coerce.number().int().min(1_000).default(3_000),
	LEADERBOARD_DURATION_MS: z.coerce.number().int().min(1_000).default(3_000),
	ROOM_CAPACITY_LIMIT: z.coerce.number().int().min(1).default(40),
	ROOM_NO_CONNECTED_MEMBERS_TTL: z.coerce
		.number()
		.int()
		.min(1_000 * 60 * 5)
		.default(1_000 * 60 * 10),
	ROOM_HOST_DISCONNECTED_IN_GROUP_TTL: z.coerce
		.number()
		.int()
		.min(1_000 * 60 * 3)
		.default(1_000 * 60 * 5),
	ROOM_HOST_DISCONNECTED_IN_CLASSROOM_TTL: z.coerce
		.number()
		.int()
		.min(1_000 * 60 * 1)
		.default(1_000 * 60 * 3),
	ROOM_FINISHED_TTL: z.coerce
		.number()
		.int()
		.min(1_000 * 60 * 10)
		.default(1_000 * 60 * 15),
})

export interface AppEnv {
	port: number
	host: string
	corsOrigins: string[]
	logLevel: LogLevel
	revealDurationMs: number
	leaderboardDurationMs: number
	roomCapacityLimit: number
	roomNoConnectedMembersTTL: number
	roomHostDisconnectedInGroupTTL: number
	roomHostDisconnectedInClassroomTTL: number
	roomFinishedTTL: number
}

function parseCorsOrigins(value: string): string[] {
	return value
		.split(',')
		.map(origin => origin.trim())
		.filter(origin => origin.length > 0)
}

export function parseEnv(input: NodeJS.ProcessEnv): AppEnv {
	const env = envSchema.parse(input)

	return {
		port: env.PORT,
		host: env.HOST,
		corsOrigins: parseCorsOrigins(env.CORS_ORIGIN),
		logLevel: env.LOG_LEVEL,
		revealDurationMs: env.REVEAL_DURATION_MS,
		leaderboardDurationMs: env.LEADERBOARD_DURATION_MS,
		roomCapacityLimit: env.ROOM_CAPACITY_LIMIT,
		roomNoConnectedMembersTTL: env.ROOM_NO_CONNECTED_MEMBERS_TTL,
		roomHostDisconnectedInGroupTTL: env.ROOM_HOST_DISCONNECTED_IN_GROUP_TTL,
		roomHostDisconnectedInClassroomTTL:
			env.ROOM_HOST_DISCONNECTED_IN_CLASSROOM_TTL,
		roomFinishedTTL: env.ROOM_FINISHED_TTL,
	}
}
