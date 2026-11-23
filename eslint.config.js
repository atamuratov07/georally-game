import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Each folder of packages/mastery/src is the only one that may import its group.
const MASTERY_BOUNDARIES = {
	fsrs: {
		group: ['ts-fsrs', '**/fsrs/*'],
		message: 'Only src/fsrs/ uses ts-fsrs; rules take a Scheduler.',
	},
	idb: {
		group: ['idb', '**/idb/*'],
		message: 'Only src/idb/ uses idb; rules take a repository.',
	},
	skills: {
		group: ['@georally/game-domain/singleplayer/*'],
		message: 'Only src/skills/ reads a mode.',
	},
}

function masteryImports(allowedFolder) {
	return {
		patterns: Object.entries(MASTERY_BOUNDARIES)
			.filter(([folder]) => folder !== allowedFolder)
			.map(([, pattern]) => pattern),
	}
}

export default defineConfig([
	globalIgnores([
		'**/dist/**',
		'**/build/**',
		'**/generated/**',
		'**/node_modules/**',
	]),
	{
		files: ['apps/web/src/**/*.{ts,tsx}'],
		extends: [
			js.configs.recommended,
			tseslint.configs.recommended,
			reactHooks.configs.flat.recommended,
			reactRefresh.configs.vite,
		],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
		},
	},
	{
		files: ['apps/web/sw/**/*.ts'],
		extends: [js.configs.recommended, tseslint.configs.recommended],
		languageOptions: {
			ecmaVersion: 2022,
			globals: globals.serviceworker,
		},
	},
	{
		files: ['apps/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
		ignores: ['apps/web/src/**/*.{ts,tsx}', 'apps/web/sw/**/*.ts'],
		extends: [js.configs.recommended, tseslint.configs.recommended],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.node,
		},
	},
	...[null, ...Object.keys(MASTERY_BOUNDARIES)].map(folder => ({
		files: [`packages/mastery/src/${folder ? `${folder}/` : ''}**/*.ts`],
		ignores: ['**/*.test.ts'],
		rules: { 'no-restricted-imports': ['error', masteryImports(folder)] },
	})),
	{
		files: ['**/*.{js,mjs,cjs}'],
		extends: [js.configs.recommended],
		languageOptions: {
			ecmaVersion: 2022,
			globals: globals.node,
		},
	},
])
