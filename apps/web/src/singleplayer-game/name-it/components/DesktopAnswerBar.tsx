import type { ReactNode } from 'react'
import { cn } from '@/shared/utils'
import { AnswerNotice } from './AnswerNotice'
import { AttemptFeedback } from './AttemptFeedback'
import { useAnswerField, type AnswerFieldOptions } from './useAnswerField'

interface DesktopAnswerBarProps extends AnswerFieldOptions {
	trailing: ReactNode
}

export function DesktopAnswerBar({
	trailing,
	...options
}: DesktopAnswerBarProps) {
	const { formRef, reveal, feedback, onSubmit, fieldProps } =
		useAnswerField(options)

	return (
		<div className='flex flex-col gap-2'>
			<AttemptFeedback attempt={feedback} enterFrom='below' />
			<form ref={formRef} className='relative' onSubmit={onSubmit}>
				<input
					{...fieldProps}
					className={cn(
						'raised floating h-16 w-full rounded-card border-2 bg-white pr-18 pl-5 text-lg font-bold text-ink outline-none transition-[border-color,box-shadow] duration-150 focus-visible:[--drop:0_0_0_6px_var(--ring),0_14px_30px_-8px_rgb(24_34_61/0.32)]',
						'placeholder:font-semibold placeholder:text-muted/70',
						reveal
							? reveal.correct
								? 'border-grass-500 font-black text-grass-700 caret-transparent [--edge:var(--color-grass-600)] [--ring:var(--color-grass-200)]'
								: 'border-coral-500 font-black text-coral-700 caret-transparent [--edge:var(--color-coral-600)] [--ring:var(--color-coral-200)]'
							: 'border-line [--edge:var(--color-line-strong)] [--ring:var(--color-ocean-200)] focus-visible:border-ocean-500',
						options.input.listening && 'placeholder:text-ocean-600',
					)}
				/>
				<div className='absolute inset-y-0 right-2 flex items-center'>
					{trailing}
				</div>
			</form>
			<AnswerNotice notice={options.input.notice} />
		</div>
	)
}
