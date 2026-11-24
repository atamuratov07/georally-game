import { animate } from 'motion'
import { useEffect, useState } from 'react'

function CountUp({ value, delay = 0.25 }: { value: number; delay?: number }) {
	const [display, setDisplay] = useState(0)

	useEffect(() => {
		const controls = animate(0, value, {
			duration: 0.9,
			delay,
			ease: [0.22, 1, 0.36, 1],
			onUpdate: latest => setDisplay(Math.round(latest)),
		})
		return () => controls.stop()
	}, [value, delay])

	return <>{display}</>
}

export { CountUp }
