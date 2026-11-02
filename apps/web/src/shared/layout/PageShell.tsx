import type { ReactNode } from 'react'
import { cn } from '@/shared/utils'
import { AppHeader } from './AppHeader'
import { SkyBackground } from './SkyBackground'

const WIDTH_CLASSES = {
	sm: 'max-w-md',
	md: 'max-w-xl',
	lg: 'max-w-3xl',
	xl: 'max-w-6xl',
} as const

export interface PageShellProps {
	width?: keyof typeof WIDTH_CLASSES
	center?: boolean
	headerActions?: ReactNode
	className?: string
	children: ReactNode
}

export function PageShell({
	width = 'md',
	center = false,
	headerActions,
	className,
	children,
}: PageShellProps) {
	return (
		<div className='relative flex min-h-dvh flex-col'>
			<SkyBackground />
			<AppHeader className='relative'>{headerActions}</AppHeader>
			<main
				className={cn(
					'relative mx-auto flex w-full flex-1 flex-col px-2.5 pt-2 pb-12 sm:px-6 sm:pt-6',
					WIDTH_CLASSES[width],
					center && 'justify-center sm:pb-24',
					className,
				)}
			>
				{children}
			</main>
		</div>
	)
}
