export {
	assertNever,
	type CommandError,
	type DomainError,
	type SessionPreparationError,
} from './errors'
export {
	advanceActiveRoomGameRound,
	revealActiveRoomGameRound,
	advanceActiveRoomGame,
	getNextActiveRoomGameAdvanceAt,
	startRoomGame,
	submitRoomGameAnswer,
	type StartRoomGameInput,
} from './orchestration'

export {
	createRoom,
	toGroupHostRoomView,
	toClassroomHostRoomView,
	toHostRoomView,
	toPlayerRoomView,
	type MemberId,
	type ClassroomHostRoomView,
	type GroupHostRoomView,
	type RoomPlayerView,
	type RoomState,
	type RoomView,
	type RoomHostView,
	type RoomFinishedView,
	type RoomMode,
} from './room/index'

export {
	DEFAULT_GAME_CONFIG,
	prepareGameSession,
	type GameCommand,
	type GameConfig,
	type GameSession,
} from './game/index'
