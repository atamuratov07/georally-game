import { defineConfig } from 'tsup'

export default defineConfig({
	entry: [
		'src/index.ts',
		'src/singleplayer/locate/index.ts',
		'src/multiplayer/index.ts',
		'src/multiplayer/game/index.ts',
		'src/multiplayer/room/index.ts',
	],
	format: ['esm'],
	dts: true,
	clean: true,
	splitting: false,
})
