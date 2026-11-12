import confetti from 'canvas-confetti'

const COLORS = ['#ffc01a', '#5ec43a', '#3a9cff', '#fb5f4c', '#9b6cfb']

const BASE: confetti.Options = {
	colors: COLORS,
	disableForReducedMotion: true,
	zIndex: 70,
}

export function celebrate(): void {
	const shared: confetti.Options = {
		...BASE,
		particleCount: 90,
		spread: 70,
		startVelocity: 55,
		ticks: 260,
	}

	void confetti({ ...shared, angle: 60, origin: { x: 0, y: 0.75 } })
	void confetti({ ...shared, angle: 120, origin: { x: 1, y: 0.75 } })
	setTimeout(() => {
		void confetti({
			...BASE,
			particleCount: 120,
			spread: 110,
			startVelocity: 40,
			origin: { x: 0.5, y: 0.35 },
			ticks: 260,
		})
	}, 250)
}

export function burst(origin: { x: number; y: number }): void {
	void confetti({
		...BASE,
		origin,
		particleCount: 140,
		spread: 360,
		startVelocity: 38,
		ticks: 240,
	})
	setTimeout(() => {
		void confetti({
			...BASE,
			origin,
			particleCount: 80,
			spread: 360,
			startVelocity: 22,
			scalar: 1.2,
			ticks: 220,
		})
	}, 180)
}
