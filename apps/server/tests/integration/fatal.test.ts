import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const serverDir = fileURLToPath(new URL('../..', import.meta.url))
const fixturePath = fileURLToPath(
	new URL('../fixtures/fatal.ts', import.meta.url),
)

function runFatalFixture(mode: 'exception' | 'rejection') {
	return new Promise<{ exitCode: number | null; stdout: string }>(resolve => {
		const child = execFile(
			process.execPath,
			['--import', 'tsx', fixturePath, mode],
			{ cwd: serverDir, maxBuffer: 10 * 1024 * 1024 },
			(_error, stdout) => {
				resolve({ exitCode: child.exitCode, stdout })
			},
		)
	})
}

describe('fatal process handlers', () => {
	it.each([
		['exception', 'uncaught_exception'],
		['rejection', 'unhandled_rejection'],
	] as const)(
		'writes the whole fatal line for an unhandled %s, then exits with code 1',
		async (mode, event) => {
			const { exitCode, stdout } = await runFatalFixture(mode)

			expect(exitCode).toBe(1)
			const lines = stdout.trim().split('\n')
			expect(lines).toHaveLength(1)
			const line = JSON.parse(lines[0] ?? '')
			expect(line).toMatchObject({
				level: 'fatal',
				event,
				err: {
					type: 'Error',
					message: expect.stringMatching(/^boom x{200000}$/),
					stack: expect.stringContaining('fatal.ts'),
				},
			})
		},
	)
})
