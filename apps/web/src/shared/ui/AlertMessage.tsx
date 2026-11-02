import type { HTMLAttributes } from 'react'
import { cn } from '../utils'

type AlertTone = 'error' | 'warning' | 'info'

const ALERT_TONE_CLASSES: Record<AlertTone, string> = {
	error: 'border-rose-200 bg-rose-50 text-rose-700',
	warning: 'border-amber-200 bg-amber-50 text-amber-800',
	info: 'border-slate-200 bg-white/85 text-slate-700',
}

export interface AlertMessageProps extends HTMLAttributes<HTMLParagraphElement> {
	tone?: AlertTone
}

export function AlertMessage({
	tone = 'info',
	className,
	...props
}: AlertMessageProps) {
	return (
		<p
			role={tone === 'error' ? 'alert' : undefined}
			className={cn(
				'rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm',
				ALERT_TONE_CLASSES[tone],
				className,
			)}
			{...props}
		/>
	)
}
