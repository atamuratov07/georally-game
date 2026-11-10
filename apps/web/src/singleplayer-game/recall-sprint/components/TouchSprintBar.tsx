import { cn } from '@/shared/utils'
import { AnswerNotice } from '../../shared/components/AnswerNotice'
import { CountdownBar } from '../../shared/components/CountdownBar'
import type { SprintControls } from '../sprintControls'
import { FoundCounter } from './FoundCounter'
import { SprintNote } from './SprintNote'
import { useSprintField } from './useSprintField'

export function TouchSprintBar({ controls }: { controls: SprintControls }) {
	const { input } = controls
	const { formRef, onSubmit, fieldProps } = useSprintField(input)

	return (
		<div className='flex flex-col gap-2'>
			<form
				ref={formRef}
				className='pointer-events-auto relative rounded-card bg-white shadow-[0_10px_30px_-10px_rgb(24_34_61/0.45)]'
				onSubmit={onSubmit}
			>
				<input
					{...fieldProps}
					className={cn(
						'h-16 w-full rounded-card bg-transparent pr-22 pb-2 pl-5 text-lg font-bold text-ink outline-none',
						'placeholder:font-semibold placeholder:text-muted/70',
						input.listening && 'placeholder:text-ocean-600',
					)}
				/>
				<div className='absolute inset-y-0 right-3 z-10 flex items-center pb-2'>
					<FoundCounter
						found={controls.found}
						total={controls.total}
						chipFrom='below'
					/>
				</div>
				<div className='pointer-events-none absolute inset-0 overflow-hidden rounded-card'>
					<div className='absolute inset-x-0 bottom-0'>
						<CountdownBar variant='strip' {...controls.timer} />
					</div>
				</div>
			</form>
			<div className='px-14'>
				<SprintNote
					attempt={input.mistake}
					scope={controls.scope}
					enterFrom='above'
				/>
			</div>
			<AnswerNotice notice={input.notice} />
		</div>
	)
}
