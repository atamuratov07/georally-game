import { motion, useReducedMotion } from 'motion/react'
import { useContext, type CSSProperties, type ReactNode } from 'react'
import { RouteIntroContext } from '../useRouteIntro'

const SPRING = { type: 'spring', stiffness: 420, damping: 32 } as const
const HIDDEN = {
	top: { y: -56, opacity: 0 },
	bottom: { y: 56, opacity: 0 },
} as const
const SHOWN = { y: 0, opacity: 1 }

export function SlideIn({
	from,
	className,
	style,
	children,
}: {
	from: 'top' | 'bottom'
	className?: string
	style?: CSSProperties
	children: ReactNode
}) {
	const reduceMotion = useReducedMotion()
	const introStage = useContext(RouteIntroContext)

	if (introStage !== 'done') {
		return null
	}

	return (
		<motion.div
			className={className}
			style={style}
			initial={reduceMotion ? false : HIDDEN[from]}
			animate={SHOWN}
			transition={SPRING}
		>
			{children}
		</motion.div>
	)
}
