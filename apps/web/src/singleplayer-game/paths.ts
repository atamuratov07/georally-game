export type SingleplayerModeId = 'locate'

export function singleplayerPaths(mode: SingleplayerModeId) {
	const setup = `/singleplayer/${mode}`
	return { setup, play: `${setup}/play` }
}
