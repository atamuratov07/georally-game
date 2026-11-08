declare global {
	interface Window {
		dataLayer?: unknown[]
		gtag?: (...args: unknown[]) => void
	}
}

function gtagEvent(
	name: string,
	params: Record<string, string | number | undefined>,
): void {
	if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
		return
	}

	const clean = Object.fromEntries(
		Object.entries(params).filter(([, value]) => value !== undefined),
	)
	window.gtag('event', name, clean)
}

export type RoomModeParam = 'group' | 'classroom'
export type RoleParam = 'host' | 'player'

export function trackRoomCreated(roomMode: RoomModeParam): void {
	gtagEvent('room_created', { room_mode: roomMode })
}

export function trackRoomJoined(roomMode: RoomModeParam): void {
	gtagEvent('room_joined', { room_mode: roomMode })
}

export type SingleplayerModeParam = 'locate' | 'name_it'

export function trackSingleplayerGameStart(params: {
	mode: SingleplayerModeParam
	difficulty: string
	scope: string
	questionCount: number
	attemptsPerQuestion?: number
	timeLimitSeconds?: number
	isRetry: boolean
}): void {
	gtagEvent('sp_game_start', {
		mode: params.mode,
		difficulty: params.difficulty,
		scope: params.scope,
		question_count: params.questionCount,
		attempts_per_question: params.attemptsPerQuestion,
		time_limit_s: params.timeLimitSeconds,
		is_retry: params.isRetry ? 1 : 0,
	})
}

export function trackMultiplayerGameStart(params: {
	roomMode: RoomModeParam
	difficulty: string
	scope: string
	questionCount: number
	questionDurationMs: number | undefined
	memberCountAtStart: number
}): void {
	gtagEvent('mp_game_start', {
		room_mode: params.roomMode,
		difficulty: params.difficulty,
		scope: params.scope,
		question_count: params.questionCount,
		question_duration_ms: params.questionDurationMs,
		member_count_at_start: params.memberCountAtStart,
	})
}

export function trackGameEntered(params: {
	roomMode: RoomModeParam
	role: RoleParam
	questionCount: number
	scope: string
	participantCount: number
}): void {
	gtagEvent('game_entered', {
		room_mode: params.roomMode,
		role: params.role,
		question_count: params.questionCount,
		scope: params.scope,
		participant_count: params.participantCount,
	})
}

export function trackSingleplayerQuestionAnswered(params: {
	mode: SingleplayerModeParam
	questionNumber: number
	isCorrect: boolean
	outcome: 'correct' | 'gave_up' | 'exhausted_attempts' | 'time_up'
	attemptsUsed: number
	responseTimeMs: number
}): void {
	gtagEvent('sp_question_answered', {
		mode: params.mode,
		question_number: params.questionNumber,
		is_correct: params.isCorrect ? 1 : 0,
		outcome: params.outcome,
		attempts_used: params.attemptsUsed,
		response_time_ms: params.responseTimeMs,
	})
}

export function trackMultiplayerQuestionAnswered(params: {
	roomMode: RoomModeParam
	role: RoleParam
	questionNumber: number
	isCorrect: boolean
	responseTimeMs: number | undefined
}): void {
	gtagEvent('mp_question_answered', {
		room_mode: params.roomMode,
		role: params.role,
		question_number: params.questionNumber,
		is_correct: params.isCorrect ? 1 : 0,
		response_time_ms: params.responseTimeMs,
	})
}

export function trackSingleplayerGameEnd(params: {
	mode: SingleplayerModeParam
	difficulty: string
	scope: string
	questionCount: number
	score: number
	correctCount: number
	durationMs: number | undefined
}): void {
	gtagEvent('sp_game_end', {
		mode: params.mode,
		difficulty: params.difficulty,
		scope: params.scope,
		question_count: params.questionCount,
		score: params.score,
		correct_count: params.correctCount,
		duration_ms: params.durationMs,
	})
}

export function trackMultiplayerGameEnd(params: {
	roomMode: RoomModeParam
	role: RoleParam
	roundsPlayed: number
	durationMs: number | undefined
	participantCount: number
	score?: number
	correctCount?: number
	rank?: number | null
	questionsAnswered?: number
}): void {
	gtagEvent('mp_game_end', {
		room_mode: params.roomMode,
		role: params.role,
		rounds_played: params.roundsPlayed,
		duration_ms: params.durationMs,
		participant_count: params.participantCount,
		score: params.score,
		correct_count: params.correctCount,
		rank: params.rank ?? undefined,
		questions_answered: params.questionsAnswered,
	})
}

export function trackRoomClosed(params: {
	reason: 'host_terminated' | 'expired' | 'server_shutdown'
	roomMode: RoomModeParam | undefined
	role: RoleParam | undefined
	phaseAtClose: 'lobby' | 'active' | 'finished' | undefined
	memberCountAtClose: number | undefined
}): void {
	gtagEvent('room_closed', {
		reason: params.reason,
		room_mode: params.roomMode,
		role: params.role,
		phase_at_close: params.phaseAtClose,
		member_count_at_close: params.memberCountAtClose,
	})
}
