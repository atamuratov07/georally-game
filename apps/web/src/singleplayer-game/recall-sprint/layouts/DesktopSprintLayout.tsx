import { motion, useReducedMotion } from 'motion/react'
import { ProjectionToggle } from '@/shared/map/ProjectionToggle'
import { CountdownBar } from '../../shared/components/CountdownBar'
import { LeaveButton } from '../../shared/components/LeaveButton'
import { DesktopSprintBar } from '../components/DesktopSprintBar'
import { FinishButton } from '../components/FinishButton'
import type { SprintLayoutProps } from '../sprintControls'

export function DesktopSprintLayout({
	controls,
	keyboardInset,
}: SprintLayoutProps) {
	const reduceMotion = useReducedMotion()
	const { map } = controls

	return (
		<>
			<div className='pointer-events-none absolute inset-x-0 top-0 z-30'>
				<CountdownBar variant='edge' {...controls.timer} />
			</div>
			<LeaveButton
				mode='recall-sprint'
				onLeave={controls.onLeave}
				className='absolute top-4 left-3 z-30'
			/>
			<div className='absolute top-4 right-3 z-30'>
				<FinishButton
					onFinish={controls.onFinish}
					confirmClassName='top-0 right-full mr-2'
				/>
			</div>
			<ProjectionToggle
				className='absolute top-18 left-3 z-30'
				value={map.projection}
				globeDisabled={!map.globeAllowed}
				onChange={map.onProjectionChange}
			/>

			<motion.div
				className='absolute inset-x-0 z-20 mx-auto w-full max-w-xl px-4'
				style={{ bottom: keyboardInset > 0 ? keyboardInset : 24 }}
				initial={reduceMotion ? false : { y: 56, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ type: 'spring', stiffness: 420, damping: 32 }}
			>
				<DesktopSprintBar controls={controls} />
			</motion.div>
		</>
	)
}
