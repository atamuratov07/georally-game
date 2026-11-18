import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts', 'src/types.ts', 'src/aliases.ts', 'src/borders.ts'],
	format: ['esm'],
	dts: true,
	clean: true,
	splitting: true,
})
