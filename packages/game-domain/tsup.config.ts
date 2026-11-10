import { defineConfig } from 'tsup'

export default defineConfig({
	entry: [
		'src/index.ts',
		'src/answers/index.ts',
		'src/singleplayer/locate/index.ts',
		'src/singleplayer/name-it/index.ts',
		'src/singleplayer/recall-sprint/index.ts',
		'src/multiplayer/index.ts',
		'src/multiplayer/game/index.ts',
		'src/multiplayer/room/index.ts',
	],
	format: ['esm'],
	dts: true,
	clean: true,
	splitting: false,
})
