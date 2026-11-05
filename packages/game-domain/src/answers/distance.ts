export function distance(a: string, b: string, maxSteps: number): number {
	if (Math.abs(a.length - b.length) > maxSteps) {
		return maxSteps + 1
	}

	let beforePrevious = new Uint32Array(b.length + 1)
	let previous = new Uint32Array(b.length + 1)
	let current = new Uint32Array(b.length + 1)
	for (let j = 0; j <= b.length; j++) {
		previous[j] = j
	}

	for (let i = 1; i <= a.length; i++) {
		current[0] = i
		let rowMin = i

		const charA = a[i - 1]
		for (let j = 1; j <= b.length; j++) {
			const charB = b[j - 1]
			let steps = Math.min(
				previous[j] + 1,
				current[j - 1] + 1,
				previous[j - 1] + (charA === charB ? 0 : 1),
			)

			if (i > 1 && j > 1 && charA === b[j - 2] && a[i - 2] === charB) {
				steps = Math.min(steps, beforePrevious[j - 2] + 1)
			}

			current[j] = steps
			rowMin = Math.min(rowMin, steps)
		}

		if (rowMin > maxSteps) {
			return maxSteps + 1
		}
		;[beforePrevious, previous, current] = [previous, current, beforePrevious]
	}

	return Math.min(previous[b.length], maxSteps + 1)
}
