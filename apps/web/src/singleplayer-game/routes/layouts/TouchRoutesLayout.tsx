import { useContext } from 'react'
import { getScore } from '@georally/game-domain/singleplayer/routes'
import { AnswerNotice } from '@/game-kit/answering/AnswerNotice'
import { VoiceButton } from '@/game-kit/answering/VoiceButton'
import { cn } from '@/shared/utils'
import { LeaveButton } from '../../shared/components/LeaveButton'
import { GiveUpButton } from '../components/GiveUpButton'
import { HintButton } from '../components/HintButton'
import { RouteFeedback } from '../components/RouteFeedback'
import { RouteJourney } from '../components/RouteJourney'
import { SlideIn } from '../components/SlideIn'
import { useRouteField } from '../components/useRouteField'
import { RouteLeaveTarget } from '../leaveTarget'
import type { RoutesLayoutProps } from '../routesControls'

export const TOUCH_KEYBOARD_GAP_PX = 12
const TOUCH_EDGE_GAP_PX = 12

export function TouchRoutesLayout({
	controls,
	keyboardInset,
}: RoutesLayoutProps) {
	const leaveTo = useContext(RouteLeaveTarget)
	const { board, state, input } = controls
	const { formRef, onSubmit, fieldProps } = useRouteField(input)
	const typing = keyboardInset > 0

	return (
		<>
			<SlideIn
				from='top'
				className='pointer-events-none absolute inset-x-3 top-3 z-30 flex flex-col gap-4'
			>
				<form
					ref={formRef}
					className='pointer-events-auto flex items-center rounded-card bg-white pr-1.5 shadow-[0_10px_30px_-10px_rgb(24_34_61/0.45)]'
					onSubmit={onSubmit}
				>
					<input
						{...fieldProps}
						className={cn(
							'h-14 min-w-0 flex-1 rounded-card bg-transparent px-5 text-lg font-bold text-ink outline-none',
							'placeholder:font-semibold placeholder:text-muted/70',
							input.listening && 'placeholder:text-ocean-600',
						)}
					/>
					<HintButton onHint={controls.onHint} compact />
				</form>
				<div className='px-14'>
					<RouteFeedback
						state={state}
						board={board}
						mistake={input.mistake}
						enterFrom='above'
					/>
				</div>
				<AnswerNotice notice={input.notice} />
			</SlideIn>

			<SlideIn from='top' className='absolute top-22 left-3 z-30'>
				<LeaveButton mode='routes' to={leaveTo} />
			</SlideIn>
			<SlideIn from='top' className='absolute top-22 right-3 z-30'>
				<GiveUpButton
					onGiveUp={controls.onGiveUp}
					confirmClassName='top-0 right-full mr-2'
				/>
			</SlideIn>
			<div
				className='pointer-events-none absolute inset-x-3 z-30 flex flex-col items-center gap-3'
				style={{
					bottom: typing
						? keyboardInset + TOUCH_KEYBOARD_GAP_PX
						: TOUCH_EDGE_GAP_PX,
				}}
			>
				{input.voiceAvailable ? (
					<SlideIn from='bottom' className='pointer-events-auto'>
						<VoiceButton
							listening={input.listening}
							onPress={input.toggleVoice}
						/>
					</SlideIn>
				) : null}
				<RouteJourney
					board={board}
					score={getScore(state)}
					arrow='above'
					className={cn('w-full px-10', typing && 'sr-only')}
				/>
			</div>
		</>
	)
}
