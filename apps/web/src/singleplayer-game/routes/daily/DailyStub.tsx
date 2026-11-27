import { motion, useReducedMotion } from 'motion/react'
import { useNow } from '@/shared/time/useNow'
import { StreakFlame } from '@/shared/widgets/streak/StreakFlame'
import { MiniTicket } from './MiniTicket'
import { useDailyToday } from './useDailyToday'

export function DailyStub() {
	const reduceMotion = useReducedMotion()
	const daily = useDailyToday(useNow(1000, true))

	if (!daily?.ticket || daily.ticket.action.kind === 'result') return null
	const { ticket, streak } = daily

	return (
		<motion.div
			className='mx-auto mb-5 max-w-md'
			initial={reduceMotion ? false : { y: -18, rotate: -5, opacity: 0 }}
			animate={{ y: 0, rotate: -1, opacity: 1 }}
			transition={{ type: 'spring', stiffness: 420, damping: 18 }}
		>
			<MiniTicket
				content={ticket}
				flame={
					streak.current > 0 ? (
						<StreakFlame
							count={streak.current}
							state={streak.todayActive ? 'lit' : 'risk'}
							className='-my-1 w-14'
						/>
					) : null
				}
			/>
		</motion.div>
	)
}
