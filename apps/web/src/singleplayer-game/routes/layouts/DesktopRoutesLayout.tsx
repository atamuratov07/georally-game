import { getScore } from '@georally/game-domain/singleplayer/routes'
import { cn } from '@/shared/utils'
import { AnswerNotice } from '../../shared/components/AnswerNotice'
import { LeaveButton } from '../../shared/components/LeaveButton'
import { MicButton } from '../../shared/components/MicButton'
import { GiveUpButton } from '../components/GiveUpButton'
import { HintButton } from '../components/HintButton'
import { RouteFeedback } from '../components/RouteFeedback'
import { RouteJourney } from '../components/RouteJourney'
import { SlideIn } from '../components/SlideIn'
import { useRouteField } from '../components/useRouteField'
import type { RoutesLayoutProps } from '../routesControls'

export function DesktopRoutesLayout({
	controls,
	keyboardInset,
}: RoutesLayoutProps) {
	const { board, state, input } = controls
	const { formRef, onSubmit, fieldProps } = useRouteField(input)

	return (
		<>
			<SlideIn from='top' className='absolute top-4 left-3 z-30'>
				<LeaveButton mode='routes' />
			</SlideIn>
			<SlideIn from='top' className='absolute top-4 right-3 z-30'>
				<GiveUpButton
					onGiveUp={controls.onGiveUp}
					confirmClassName='top-0 right-full mr-2'
				/>
			</SlideIn>

			<div className='pointer-events-none absolute inset-x-0 top-4 z-20 mx-auto w-full max-w-md px-4'>
				<RouteJourney board={board} score={getScore(state)} arrow='below' />
			</div>

			<SlideIn
				from='bottom'
				className='absolute inset-x-0 z-20 mx-auto flex w-full max-w-2xl flex-col gap-3 px-4'
				style={{ bottom: keyboardInset > 0 ? keyboardInset : 24 }}
			>
				<RouteFeedback
					state={state}
					board={board}
					mistake={input.mistake}
					enterFrom='below'
				/>
				<div className='flex items-center gap-3'>
					<form
						ref={formRef}
						className='relative flex-1'
						onSubmit={onSubmit}
					>
						<input
							{...fieldProps}
							className={cn(
								'raised floating h-16 w-full rounded-card border-2 border-line bg-white pr-18 pl-5 text-lg font-bold text-ink outline-none transition-[border-color,box-shadow] duration-150 [--edge:var(--color-line-strong)] [--ring:var(--color-ocean-200)] focus-visible:border-ocean-500 focus-visible:[--drop:0_0_0_6px_var(--ring),0_14px_30px_-8px_rgb(24_34_61/0.32)]',
								'placeholder:font-semibold placeholder:text-muted/70',
								input.listening && 'placeholder:text-ocean-600',
							)}
						/>
						{input.voiceAvailable ? (
							<div className='absolute inset-y-0 right-2 flex items-center'>
								<MicButton
									listening={input.listening}
									onPress={input.toggleVoice}
								/>
							</div>
						) : null}
					</form>
					<HintButton onHint={controls.onHint} />
				</div>
				<AnswerNotice notice={input.notice} />
			</SlideIn>
		</>
	)
}
