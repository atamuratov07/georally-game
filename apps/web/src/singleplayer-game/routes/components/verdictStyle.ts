import type { RouteVerdict } from '@georally/game-domain/singleplayer/routes'

export const VERDICT_PILL: Record<RouteVerdict, string> = {
	route: 'bg-grass-500 text-white',
	near: 'bg-sunflower-300 text-ink',
	off: 'bg-coral-500 text-white',
}
