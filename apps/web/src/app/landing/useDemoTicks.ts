import { useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

const TICK_MS = 80

export function useDemoTicks(
	stepTicks: readonly number[],
	stillTick: number,
	active: boolean,
) {
	const reduceMotion = useReducedMotion()
	const [tick, setTick] = useState(0)

	useEffect(() => {
		if (reduceMotion || !active) {
			return
		}
		const timer = setInterval(() => setTick(value => value + 1), TICK_MS)
		return () => clearInterval(timer)
	}, [active, reduceMotion])

	const cycleTicks = stepTicks.reduce((sum, ticks) => sum + ticks, 0)
	let at = reduceMotion ? stillTick : tick % cycleTicks
	let step = 0
	while (at >= stepTicks[step]) {
		at -= stepTicks[step]
		step += 1
	}
	return {
		cycle: Math.floor(tick / cycleTicks),
		step,
		at,
		still: Boolean(reduceMotion),
	}
}
