export type RandomNumberGenerator = () => number

export function pickRandomIds<T>(
	ids: readonly T[],
	count: number,
	rng: RandomNumberGenerator = Math.random,
): T[] {
	if (count <= 0 || ids.length === 0) {
		return []
	}

	const shuffled = [...ids]

	for (let i = shuffled.length - 1; i > 0; i--) {
		const swapIndex = Math.floor(rng() * (i + 1))
		;[shuffled[i], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i]]
	}

	return shuffled.slice(0, Math.min(count, shuffled.length))
}

// mulberry32: a small 32-bit generator; the same seed always yields the same sequence.
export function seededRandom(seed: number): RandomNumberGenerator {
	let state = seed >>> 0
	return () => {
		state = (state + 0x6d2b79f5) >>> 0
		let t = state
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
	}
}
