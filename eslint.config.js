import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

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
	{
		files: ['**/*.{js,mjs,cjs}'],
		extends: [js.configs.recommended],
		languageOptions: {
			ecmaVersion: 2022,
			globals: globals.node,
		},
	},
])
