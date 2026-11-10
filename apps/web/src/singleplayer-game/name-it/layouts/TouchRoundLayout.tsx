import { motion, useReducedMotion } from 'motion/react'
import { CardToggle } from '@/shared/map/CardToggle'
import { ProjectionToggle } from '@/shared/map/ProjectionToggle'
import { ScoreBanner } from '@/shared/widgets/ScoreBanner'
import { LeaveButton } from '../../shared/components/LeaveButton'
import { VoiceButton } from '../../shared/components/VoiceButton'
import { TouchAnswerBar } from '../components/TouchAnswerBar'
import { GiveUpButton, NextButton } from '../components/RoundButtons'
import type { RoundLayoutProps } from '../roundControls'

export const TOUCH_KEYBOARD_GAP_PX = 12
export const TOUCH_EDGE_GAP_PX = 24

const SPRING = { type: 'spring', stiffness: 420, damping: 32 } as const

export function TouchRoundLayout({
	controls,
	keyboardInset,
}: RoundLayoutProps) {
	const reduceMotion = useReducedMotion()
	const { stage, input, map } = controls

	return (
		<>
			<motion.div
				className='pointer-events-none absolute inset-x-3 top-3 z-30'
				initial={reduceMotion ? false : { y: -56, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={SPRING}
			>
				<TouchAnswerBar
					stage={stage}
					answer={controls.answer}
					lastAttempt={controls.lastAttempt}
					input={input}
					progress={controls.progress}
					timer={controls.timer}
					onNext={controls.onNext}
				/>
			</motion.div>
			<LeaveButton mode='name-it' className='absolute top-22 left-3 z-30' />
			<div className='absolute top-22 right-3 z-30 flex flex-col gap-2'>
				<ProjectionToggle
					value={map.projection}
					globeDisabled={!map.globeAllowed}
					onChange={map.onProjectionChange}
				/>
				{map.hasCard ? (
					<CardToggle
						hidden={map.cardHidden}
						onHiddenChange={map.onCardHiddenChange}
					/>
				) : null}
			</div>
			<ScoreBanner
				className='top-20 origin-top scale-80'
				{...controls.score}
			/>

			<motion.div
				className='pointer-events-none absolute inset-x-0 z-30 flex justify-center'
				style={{
					bottom:
						keyboardInset > 0
							? keyboardInset + TOUCH_KEYBOARD_GAP_PX
							: TOUCH_EDGE_GAP_PX,
				}}
				initial={reduceMotion ? false : { y: 56, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={SPRING}
			>
				<div className='pointer-events-auto relative grid size-16 place-items-center'>
					{controls.canGiveUp ? (
						<GiveUpButton
							onGiveUp={controls.onGiveUp}
							className='absolute right-full mr-6'
						/>
					) : null}
					{stage === 'revealed' && controls.answer ? (
						<NextButton size='main' onNext={controls.onNext} />
					) : input.voiceAvailable && stage === 'answering' ? (
						<VoiceButton
							listening={input.listening}
							onPress={input.toggleVoice}
						/>
					) : null}
				</div>
			</motion.div>
		</>
	)
}
