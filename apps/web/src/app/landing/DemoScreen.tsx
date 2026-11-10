import { useEffect, useRef, useState, type ReactNode } from 'react'
import { DEMO_SIZE } from './demoSize'

export function DemoScreen({ children }: { children: ReactNode }) {
	const frameRef = useRef<HTMLDivElement>(null)
	const [scale, setScale] = useState(0)

	useEffect(() => {
		const frame = frameRef.current
		if (!frame) {
			return
		}
		const observer = new ResizeObserver(([entry]) =>
			setScale(entry.contentRect.width / DEMO_SIZE.width),
		)
		observer.observe(frame)
		return () => observer.disconnect()
	}, [])

	return (
		<div
			aria-hidden='true'
			inert
			className='raised relative mx-auto w-full max-w-xl overflow-hidden rounded-[28px] border-2 border-ocean-200 select-none [--edge:var(--color-ocean-300)]'
			style={{
				aspectRatio: `${DEMO_SIZE.width} / ${DEMO_SIZE.height}`,
				backgroundColor: 'var(--color-ocean-200)',
			}}
		>
			<div ref={frameRef} className='absolute inset-0'>
				{scale > 0 ? (
					<div
						className='absolute top-0 left-0 origin-top-left'
						style={{
							width: DEMO_SIZE.width,
							height: DEMO_SIZE.height,
							transform: `scale(${scale})`,
						}}
					>
						{children}
					</div>
				) : null}
			</div>
		</div>
	)
}
