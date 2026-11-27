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

const MASTERY_ADAPTERS = {
	group: ['@georally/mastery/fsrs', '@georally/mastery/idb'],
	message: 'Only mastery/container.ts creates the scheduler and repository.',
}

const MASTERY_FEATURE = {
	regex: '^(?:@|\\.\\.?)/(?:.*/)?mastery(?:$|/(?!bridge/))',
	message: 'A mode reaches review only through mastery/bridge/.',
}

// apps/web/src layers, lowest first: shared/, game-kit/, then the features.
const FEATURES = ['singleplayer-game', 'mastery', 'multiplayer-game']
const layerPattern = (folders, message) => ({
	group: folders.flatMap(folder => [`@/${folder}/**`, `**/${folder}/**`]),
	message,
})
const SHARED_LAYER = layerPattern(
	['game-kit', ...FEATURES],
	'shared/ imports neither the game kit nor a feature.',
)
const GAME_KIT_LAYER = layerPattern(
	FEATURES,
	'game-kit/ imports shared/ only, never a feature.',
)

const LIGHT_HOME =
	'The home page strip loads neither the catalog nor the map; import them lazily.'

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
		files: ['packages/mastery/src/**/*.ts'],
		ignores: ['**/*.test.ts'],
		rules: {
			'no-restricted-properties': [
				'error',
				{
					object: 'Date',
					property: 'now',
					message: 'Take now as an argument.',
				},
				{
					object: 'Math',
					property: 'random',
					message: 'Use seededRandom.',
				},
			],
			'no-restricted-syntax': [
				'error',
				{
					selector:
						"NewExpression[callee.name='Date'][arguments.length=0]",
					message: 'Take now as an argument.',
				},
			],
		},
	},
	{
		files: ['apps/web/src/**/*.{ts,tsx}'],
		ignores: ['apps/web/src/mastery/container.ts'],
		rules: {
			'no-restricted-imports': ['error', { patterns: [MASTERY_ADAPTERS] }],
		},
	},
	{
		files: ['apps/web/src/shared/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{ patterns: [MASTERY_ADAPTERS, SHARED_LAYER] },
			],
		},
	},
	{
		files: ['apps/web/src/game-kit/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{ patterns: [MASTERY_ADAPTERS, GAME_KIT_LAYER] },
			],
		},
	},
	{
		files: ['apps/web/src/singleplayer-game/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{ patterns: [MASTERY_ADAPTERS, MASTERY_FEATURE] },
			],
		},
	},
	{
		files: ['apps/web/src/app/landing/{TodaySection,ReviewCard}.tsx'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					paths: [
						{ name: '@georally/country-catalog', message: LIGHT_HOME },
					],
					patterns: [
						MASTERY_ADAPTERS,
						{
							group: ['maplibre-gl', '@/shared/map/**'],
							message: LIGHT_HOME,
						},
					],
				},
			],
		},
	},
	{
		files: ['**/*.{js,mjs,cjs}'],
		extends: [js.configs.recommended],
		languageOptions: {
			ecmaVersion: 2022,
			globals: globals.node,
		},
	},
])
