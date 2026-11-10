import { motion, useReducedMotion } from 'motion/react'
import { CardToggle } from '@/shared/map/CardToggle'
import { ProjectionToggle } from '@/shared/map/ProjectionToggle'
import { ScoreBanner } from '@/shared/widgets/ScoreBanner'
import { CountdownBar } from '../../shared/components/CountdownBar'
import { LeaveButton } from '../../shared/components/LeaveButton'
import { MicButton } from '../../shared/components/MicButton'
import { DesktopAnswerBar } from '../components/DesktopAnswerBar'
import {
	GiveUpButton,
	NextButton,
	ProgressChip,
} from '../components/RoundButtons'
import type { RoundLayoutProps } from '../roundControls'

export function DesktopRoundLayout({
	controls,
	keyboardInset,
}: RoundLayoutProps) {
	const reduceMotion = useReducedMotion()
	const { stage, input, map } = controls

	return (
		<>
			<div className='pointer-events-none absolute inset-x-0 top-0 z-30'>
				<CountdownBar variant='edge' {...controls.timer} />
			</div>
			<LeaveButton mode='name-it' className='absolute top-4 left-3 z-30' />
			<ProjectionToggle
				className='absolute top-18 left-3 z-30'
				value={map.projection}
				globeDisabled={!map.globeAllowed}
				onChange={map.onProjectionChange}
			/>
			<ProgressChip
				{...controls.progress}
				className='absolute top-4 right-3 z-30'
			/>
			{controls.canGiveUp ? (
				<GiveUpButton
					onGiveUp={controls.onGiveUp}
					className='absolute top-18 right-3 z-30'
				/>
			) : null}
			{map.hasCard ? (
				<CardToggle
					className='absolute top-18 right-3 z-30'
					hidden={map.cardHidden}
					onHiddenChange={map.onCardHiddenChange}
				/>
			) : null}
			<ScoreBanner className='top-20' {...controls.score} />

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
							<NextButton size='inline' onNext={controls.onNext} />
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
