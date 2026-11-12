import { LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from '@/shared/ui'
import { cn } from '@/shared/utils'
import { PageShell } from './PageShell'

const TONE_TEXT = {
	ocean: 'text-ocean-500',
	coral: 'text-coral-500',
	sunflower: 'text-sunflower-500',
	neutral: 'text-muted',
} as const

export interface StatusScreenProps {
	title: string
	description?: ReactNode
	/** Omit to show a spinner. */
	icon?: ReactNode
	tone?: keyof typeof TONE_TEXT
	actions?: ReactNode
	footer?: ReactNode
}

/** A trailing period is dropped from the title, so error sentences can be titles. */
export function StatusScreen({
	title,
	description,
	icon,
	tone = 'ocean',
	actions,
	footer,
}: StatusScreenProps) {
	return (
		<PageShell width='sm' center>
			<Card className='flex flex-col items-center text-center'>
				<span
					aria-hidden='true'
					className={cn(
						'[&_svg]:size-14 [&_svg]:stroke-[2.25]',
						TONE_TEXT[tone],
					)}
				>
					{icon ?? <LoaderCircle className='animate-spin' />}
				</span>
				<h1 className='mt-5 text-2xl font-black tracking-tight text-balance sm:text-3xl'>
					{title.replace(/\.$/, '')}
				</h1>
				{description ? (
					<p className='mt-2 text-base font-medium text-muted'>
						{description}
					</p>
				) : null}
				{actions ? (
					<div className='mt-7 flex w-full flex-col-reverse items-center gap-4 sm:flex-row sm:justify-center sm:gap-6'>
						{actions}
					</div>
				) : null}
			</Card>
			{footer ? (
				<div className='mt-4 flex justify-center'>{footer}</div>
			) : null}
		</PageShell>
	)
}
