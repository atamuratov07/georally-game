import {
	getScore,
	getTimeline,
	type FinishedRouteState,
	type RouteBoard,
	type RouteVerdict,
} from '@georally/game-domain/singleplayer/routes'

export type ShareMark = RouteVerdict | 'hint'

export interface ShareMove {
	countryId: string
	mark: ShareMark
}

const SYMBOL: Readonly<Record<ShareMark, string>> = {
	route: '🟩',
	near: '🟨',
	off: '🟥',
	hint: '💡',
}
const LINK = 'georally.world/daily'
export const TILE_STEP = 0.12
export const SHOWN_TILES = 16

export function tilesShownAt(delay: number, moveCount: number) {
	return delay + Math.min(moveCount, SHOWN_TILES) * TILE_STEP
}

export function shareMoves(
	board: RouteBoard,
	state: FinishedRouteState,
): ShareMove[] {
	return getTimeline(state).map(({ kind, countryId }) => ({
		countryId,
		mark: kind === 'hint' ? 'hint' : board.verdict(countryId),
	}))
}

export function shareText(
	number: number,
	board: RouteBoard,
	state: FinishedRouteState,
): string {
	const score = state.outcome === 'solved' ? getScore(state) : 'X'
	const marks = shareMoves(board, state)
		.map(({ mark }) => SYMBOL[mark])
		.join('')
	return [
		`GeoRally Routes #${number} · ${score}/${board.par}`,
		marks,
		LINK,
	].join('\n')
}
