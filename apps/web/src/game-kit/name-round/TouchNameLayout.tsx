import { motion, useReducedMotion } from 'motion/react'
import { TouchAnswerBar } from '../answering/TouchAnswerBar'
import { VoiceButton } from '../answering/VoiceButton'
import { GiveUpButton, NextButton } from './RoundButtons'
import type { NameRoundLayoutProps } from './types'

export const TOUCH_KEYBOARD_GAP_PX = 12
export const TOUCH_EDGE_GAP_PX = 24

const SPRING = { type: 'spring', stiffness: 420, damping: 32 } as const

export function TouchNameLayout({
	controls,
	slots,
	projectionToggle,
	cardToggle,
	keyboardInset,
}: NameRoundLayoutProps) {
	const reduceMotion = useReducedMotion()
	const { stage, input } = controls

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
					timer={controls.timer}
					end={slots.topEnd}
					onNext={controls.onNext}
				/>
			</motion.div>
			{slots.topStart ? (
				<div className='absolute top-22 left-3 z-30'>{slots.topStart}</div>
			) : null}
			<div className='absolute top-22 right-3 z-30 flex flex-col gap-2'>
				{projectionToggle}
				{cardToggle}
			</div>
			{slots.overlay}

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
						<NextButton
							size='main'
							pending={controls.nextPending}
							onNext={controls.onNext}
						/>
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
