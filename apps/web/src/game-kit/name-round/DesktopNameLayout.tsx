import { motion, useReducedMotion } from 'motion/react'
import { DesktopAnswerBar } from '../answering/DesktopAnswerBar'
import { MicButton } from '../answering/MicButton'
import { CountdownBar } from '../hud/CountdownBar'
import { GiveUpButton, NextButton } from './RoundButtons'
import type { NameRoundLayoutProps } from './types'

export function DesktopNameLayout({
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
			<div className='pointer-events-none absolute inset-x-0 top-0 z-30'>
				<CountdownBar variant='edge' {...controls.timer} />
			</div>
			<div className='absolute top-4 left-3 z-30 flex flex-col gap-3'>
				{slots.topStart}
				{projectionToggle}
			</div>
			<div className='absolute top-4 right-3 z-30 flex flex-col items-end gap-5'>
				{slots.topEnd}
				{controls.canGiveUp ? (
					<GiveUpButton onGiveUp={controls.onGiveUp} />
				) : (
					cardToggle
				)}
			</div>
			{slots.overlay}

			<motion.div
				className='absolute inset-x-0 z-20 mx-auto w-full max-w-xl px-4'
				style={{ bottom: keyboardInset > 0 ? keyboardInset : 24 }}
				initial={reduceMotion ? false : { y: 56, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ type: 'spring', stiffness: 420, damping: 32 }}
			>
				<DesktopAnswerBar
					stage={stage}
					answer={controls.answer}
					lastAttempt={controls.lastAttempt}
					input={input}
					onNext={controls.onNext}
					trailing={
						stage === 'revealed' && controls.answer ? (
							<NextButton
								size='inline'
								pending={controls.nextPending}
								onNext={controls.onNext}
							/>
						) : input.voiceAvailable && stage === 'answering' ? (
							<MicButton
								listening={input.listening}
								onPress={input.toggleVoice}
							/>
						) : null
					}
				/>
			</motion.div>
		</>
	)
}
