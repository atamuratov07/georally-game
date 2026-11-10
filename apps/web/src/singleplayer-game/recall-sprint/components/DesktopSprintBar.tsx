import { cn } from '@/shared/utils'
import { AnswerNotice } from '../../shared/components/AnswerNotice'
import { MicButton } from '../../shared/components/MicButton'
import type { SprintControls } from '../sprintControls'
import { FoundCounter } from './FoundCounter'
import { SprintNote } from './SprintNote'
import { useSprintField } from './useSprintField'

export function DesktopSprintBar({ controls }: { controls: SprintControls }) {
	const { input } = controls
	const { formRef, onSubmit, fieldProps } = useSprintField(input)

	return (
		<div className='flex flex-col gap-2'>
			<SprintNote
				attempt={input.mistake}
				scope={controls.scope}
				enterFrom='below'
			/>
			<form ref={formRef} className='relative' onSubmit={onSubmit}>
				<input
					{...fieldProps}
					className={cn(
						'raised floating h-16 w-full rounded-card border-2 border-line bg-white pr-36 pl-5 text-lg font-bold text-ink outline-none transition-[border-color,box-shadow] duration-150 [--edge:var(--color-line-strong)] [--ring:var(--color-ocean-200)] focus-visible:border-ocean-500 focus-visible:[--drop:0_0_0_6px_var(--ring),0_14px_30px_-8px_rgb(24_34_61/0.32)]',
						'placeholder:font-semibold placeholder:text-muted/70',
						input.listening && 'placeholder:text-ocean-600',
					)}
				/>
				<div className='absolute inset-y-0 right-2 flex items-center gap-1'>
					<FoundCounter
						found={controls.found}
						total={controls.total}
						chipFrom='above'
					/>
					{input.voiceAvailable ? (
						<MicButton
							listening={input.listening}
							onPress={input.toggleVoice}
						/>
					) : null}
				</div>
			</form>
			<AnswerNotice notice={input.notice} />
		</div>
	)
}
