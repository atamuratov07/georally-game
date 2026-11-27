import {
	getScore,
	isPerfect,
	type FinishedRouteState,
	type RouteBoard,
} from '@georally/game-domain/singleplayer/routes'
import { motion, useReducedMotion } from 'motion/react'
import { useContext, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils'
import { LeaveButton } from '../../shared/components/LeaveButton'
import { RouteLeaveTarget } from '../leaveTarget'
import { RouteJourney } from './RouteJourney'

const SPRING = { type: 'spring', stiffness: 380, damping: 28 } as const

interface RouteResultProps {
	board: RouteBoard
	state: FinishedRouteState
	action: ReactNode
	onLeave: () => void
	leaveClassName: string
	headerClassName: string
	headerEnters: boolean
	actionShown: boolean
}

export function RouteResult({
	board,
	state,
	action,
	onLeave,
	leaveClassName,
	headerClassName,
	headerEnters,
	actionShown,
}: RouteResultProps) {
	const { t } = useTranslation()
	const reduceMotion = useReducedMotion()
	const score = getScore(state)
	const leave = useContext(RouteLeaveTarget)
	const outcome =
		state.outcome === 'gaveUp'
			? t('routes.result.gaveUp')
			: isPerfect(board, state)
				? t('routes.result.perfect')
				: t('routes.result.solved')

	return (
		<>
			<h2 className='sr-only' role='status'>
				{outcome}
			</h2>
			<LeaveButton
				mode='routes'
				to={leave.to}
				state={leave.state}
				onLeave={onLeave}
				className={leaveClassName}
			/>
			<motion.div
				className={cn(
					'pointer-events-none absolute inset-x-0 top-4 z-30 mx-auto w-full max-w-md',
					headerClassName,
				)}
				initial={
					reduceMotion || !headerEnters ? false : { y: -40, opacity: 0 }
				}
				animate={{ y: 0, opacity: 1 }}
				transition={SPRING}
			>
				<RouteJourney board={board} score={score} arrow='below' />
			</motion.div>
			{action && actionShown ? (
				<motion.div
					className='absolute inset-x-0 bottom-6 z-30 flex justify-center px-4'
					initial={reduceMotion ? false : { y: 48, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={SPRING}
				>
					{action}
				</motion.div>
			) : null}
		</>
	)
}
