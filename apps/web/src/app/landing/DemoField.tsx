import type { ReactNode } from 'react'
import { cn } from '@/shared/utils'

interface DemoFieldProps {
	text: string
	placeholder: string
	listening: boolean
	correct: boolean
	trailing: ReactNode
	trailingWidth: 'button' | 'counter'
}

export function DemoField({
	text,
	placeholder,
	listening,
	correct,
	trailing,
	trailingWidth,
}: DemoFieldProps) {
	return (
		<div className='absolute inset-x-0 bottom-6 mx-auto w-full max-w-xl px-4'>
			<div
				className={cn(
					'raised floating relative flex h-16 w-full items-center rounded-card border-2 bg-white pl-5 text-lg font-bold text-ink',
					trailingWidth === 'button' ? 'pr-18' : 'pr-36',
					correct
						? 'border-grass-500 font-black text-grass-700 [--edge:var(--color-grass-600)]'
						: 'border-ocean-500 [--drop:0_0_0_6px_var(--color-ocean-200),0_14px_30px_-8px_rgb(24_34_61/0.32)] [--edge:var(--color-line-strong)]',
				)}
			>
				{text ? (
					<span className='truncate'>{text}</span>
				) : (
					<span
						className={cn(
							'truncate font-semibold',
							listening ? 'text-ocean-600' : 'text-muted/70',
						)}
					>
						{placeholder}
					</span>
				)}
				{correct || listening ? null : (
					<span className='ml-0.5 inline-block h-6 w-0.5 animate-caret-blink bg-ink' />
				)}
				<div className='absolute inset-y-0 right-2 flex items-center gap-1'>
					{trailing}
				</div>
			</div>
		</div>
	)
}
