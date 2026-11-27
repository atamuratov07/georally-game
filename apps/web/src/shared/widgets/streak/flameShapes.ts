type Point = readonly [number, number]

interface FlameShape {
	w: number
	h: number
	lean: number
	right: number
	left: number
}

interface DropShape {
	w: number
	h: number
	lean: number
}

const CX = 50

const round = (n: number) => Math.round(n * 10) / 10
const curve = (a: Point, b: Point, end: Point) =>
	`C${round(a[0])} ${round(a[1])} ${round(b[0])} ${round(b[1])} ${round(end[0])} ${round(end[1])}`

// A strong base swooping up to a hooked main tip, with C-shaped bites
// between it and two side tongues. Every frame uses the same commands, so
// SVG can morph between them.
function flamePath({ w, h, lean, right, left }: FlameShape, base: number) {
	const tip: Point = [CX + lean, base - h]
	const rightTip: Point = [CX + w * 0.8, base - right]
	const rightBite: Point = [CX + w * 0.3, base - right * 0.64]
	const leftTip: Point = [CX - w * 0.84, base - left]
	const leftBite: Point = [CX - w * 0.34, base - left * 0.7]
	return [
		`M${CX} ${base}`,
		curve(
			[CX + w * 0.95, base + 1],
			[CX + w * 1.12, base - right * 0.42],
			rightTip,
		),
		curve(
			[rightTip[0] - w * 0.06, rightTip[1] + right * 0.22],
			[rightBite[0] + w * 0.22, rightBite[1] + right * 0.06],
			rightBite,
		),
		curve(
			[rightBite[0] - w * 0.02, rightBite[1] - h * 0.22],
			[tip[0] + w * 0.44, tip[1] + h * 0.42],
			tip,
		),
		curve(
			[tip[0] + w * 0.02, tip[1] + h * 0.3],
			[leftBite[0] - w * 0.04, leftBite[1] - h * 0.28],
			leftBite,
		),
		curve(
			[leftBite[0] - w * 0.2, leftBite[1] + left * 0.06],
			[leftTip[0] + w * 0.1, leftTip[1] + left * 0.26],
			leftTip,
		),
		curve(
			[leftTip[0] - w * 0.3, leftTip[1] + left * 0.42],
			[CX - w * 0.95, base + 1],
			[CX, base],
		),
		'Z',
	].join('')
}

function dropPath({ w, h, lean }: DropShape, base: number) {
	const tip: Point = [CX + lean, base - h]
	return [
		`M${CX} ${base}`,
		curve([CX + w * 1.15, base + 1], [CX + w * 0.75, base - h * 0.62], tip),
		curve(
			[CX - w * 0.55, base - h * 0.6],
			[CX - w * 1.15, base + 1],
			[CX, base],
		),
		'Z',
	].join('')
}

// Ascent, swelling, division, reduction.
const CYCLE: readonly FlameShape[] = [
	{ w: 35, h: 94, lean: 4, right: 62, left: 50 },
	{ w: 38, h: 86, lean: -4, right: 56, left: 56 },
	{ w: 36, h: 100, lean: 8, right: 70, left: 46 },
	{ w: 34, h: 84, lean: 0, right: 54, left: 53 },
]

const DROPS: readonly DropShape[] = [
	{ w: 18, h: 40, lean: 3 },
	{ w: 20, h: 36, lean: -3 },
	{ w: 18, h: 44, lean: 5 },
	{ w: 19, h: 38, lean: 0 },
]

const shift = <T>(list: readonly T[], by: number) => [
	...list.slice(by),
	...list.slice(0, by),
]
const loop = (frames: readonly string[]) => [...frames, frames[0]].join(';')
const inner = (shape: FlameShape): FlameShape => ({
	w: shape.w * 0.7,
	h: shape.h * 0.66,
	lean: shape.lean,
	right: shape.right * 0.66,
	left: shape.left * 0.66,
})

export const FLAME = {
	outer: loop(CYCLE.map(shape => flamePath(shape, 112))),
	mid: loop(shift(CYCLE, 1).map(shape => flamePath(inner(shape), 110))),
	core: loop(shift(DROPS, 2).map(shape => dropPath(shape, 108))),
	still: {
		outer: flamePath(CYCLE[0], 112),
		mid: flamePath(inner(CYCLE[1]), 110),
		core: dropPath(DROPS[2], 108),
	},
}
