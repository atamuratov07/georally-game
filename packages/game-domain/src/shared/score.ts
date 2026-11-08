export function speedScore(elapsedMs: number, windowMs: number): number {
	const left = Math.min(Math.max(1 - elapsedMs / windowMs, 0), 1)
	return 50 + 50 * left
}
