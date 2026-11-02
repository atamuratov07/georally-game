import type { HTMLAttributes } from 'react'
import { cn } from '../utils'

export interface ScreenShellProps extends HTMLAttributes<HTMLElement> {
	center?: boolean
}

export function ScreenShell({
	center = false,
	className,
	...props
}: ScreenShellProps) {
	return (
		<main
			className={cn(
				'fixed inset-0 overflow-y-auto',
				center && 'grid place-items-center',
				className,
			)}
			{...props}
		/>
	)
}
