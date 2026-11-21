import { Flag } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { ProjectionToggle } from '@/shared/map/ProjectionToggle'
import { ConfirmButton } from '../../shared/components/ConfirmButton'
import { LeaveButton } from '../../shared/components/LeaveButton'
import { VoiceButton } from '../../shared/components/VoiceButton'
import { TouchSprintBar } from '../components/TouchSprintBar'
import type { SprintLayoutProps } from '../sprintControls'

export const TOUCH_KEYBOARD_GAP_PX = 12
export const TOUCH_EDGE_GAP_PX = 24

const SPRING = { type: 'spring', stiffness: 420, damping: 32 } as const

export function TouchSprintLayout({
	controls,
	keyboardInset,
}: SprintLayoutProps) {
	const { t } = useTranslation()
	const reduceMotion = useReducedMotion()
	const { input, map } = controls

	return (
		<>
			<motion.div
				className='pointer-events-none absolute inset-x-3 top-3 z-30'
				initial={reduceMotion ? false : { y: -56, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={SPRING}
			>
				<TouchSprintBar controls={controls} />
			</motion.div>
			<LeaveButton
				mode='recall-sprint'
				onLeave={controls.onLeave}
				className='absolute top-22 left-3 z-30'
			/>
			<div className='absolute top-22 right-3 z-30'>
				<ConfirmButton
					label={t('recallSprint.finish')}
					confirmLabel={t('recallSprint.finishConfirm')}
					icon={<Flag aria-hidden='true' />}
					onConfirm={controls.onFinish}
					confirmClassName='top-0 right-full mr-2'
				/>
			</div>
			<ProjectionToggle
				className='absolute top-36 left-3 z-30'
				value={map.projection}
				globeDisabled={!map.globeAllowed}
				onChange={map.onProjectionChange}
			/>

			<div
				className='pointer-events-none absolute inset-x-0 z-30 flex justify-center'
				style={{
					bottom:
						keyboardInset > 0
							? keyboardInset + TOUCH_KEYBOARD_GAP_PX
							: TOUCH_EDGE_GAP_PX,
				}}
			>
				{input.voiceAvailable ? (
					<div className='pointer-events-auto'>
						<VoiceButton
							listening={input.listening}
							onPress={input.toggleVoice}
						/>
					</div>
				) : null}
			</div>
		</>
	)
}
