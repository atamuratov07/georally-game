export type SingleplayerModeId = 'locate' | 'name-it'

export function singleplayerPaths(mode: SingleplayerModeId) {
	const setup = `/singleplayer/${mode}`
	return { setup, play: `${setup}/play` }
}
