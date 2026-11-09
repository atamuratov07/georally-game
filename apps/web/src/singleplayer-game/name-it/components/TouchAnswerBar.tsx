import { cn } from '@/shared/utils'
import type { RoundControls } from '../roundControls'
import { AnswerNotice } from './AnswerNotice'
import { AttemptFeedback } from './AttemptFeedback'
import { CountdownBar } from './Countdown'
import { ProgressText } from './RoundButtons'
import { useAnswerField, type AnswerFieldOptions } from './useAnswerField'

interface TouchAnswerBarProps extends AnswerFieldOptions {
	progress: RoundControls['progress']
	timer: RoundControls['timer']
}

export function TouchAnswerBar({
	progress,
	timer,
	...options
}: TouchAnswerBarProps) {
	const { formRef, reveal, feedback, onSubmit, fieldProps } =
		useAnswerField(options)

	return (
		<div className='flex flex-col gap-2'>
			<form
				ref={formRef}
				className={cn(
					'relative overflow-hidden rounded-card shadow-[0_10px_30px_-10px_rgb(24_34_61/0.45)] transition-colors duration-200 motion-reduce:transition-none',
					reveal
						? reveal.correct
							? 'bg-grass-50'
							: 'bg-coral-50'
						: 'bg-white',
				)}
				onSubmit={onSubmit}
			>
				<input
					{...fieldProps}
					className={cn(
						'h-16 w-full bg-transparent pr-18 pb-2 pl-5 text-lg font-bold text-ink outline-none',
						'placeholder:font-semibold placeholder:text-muted/70',
						reveal &&
							(reveal.correct
								? 'font-black text-grass-700 caret-transparent'
								: 'font-black text-coral-700 caret-transparent'),
						options.input.listening && 'placeholder:text-ocean-600',
					)}
				/>
				<div className='absolute inset-y-0 right-3 flex items-center pb-2'>
					<ProgressText {...progress} />
				</div>
				<div className='absolute inset-x-0 bottom-0'>
					<CountdownBar variant='strip' {...timer} />
				</div>
			</form>
			<div className='px-14'>
				<AttemptFeedback attempt={feedback} enterFrom='above' />
			</div>
			<AnswerNotice notice={options.input.notice} />
		</div>
	)
}
