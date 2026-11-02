import type { HTMLAttributes } from 'react'
import { cn } from '../utils'

type SurfaceWidth = 'sm' | 'md' | 'lg' | 'xl' | 'none'

const SURFACE_WIDTH_CLASSES: Record<SurfaceWidth, string> = {
	sm: 'max-w-lg',
	md: 'max-w-xl',
	lg: 'max-w-2xl',
	xl: 'max-w-3xl',
	none: '',
}

export interface SurfacePanelProps extends HTMLAttributes<HTMLElement> {
	width?: SurfaceWidth
}

export function SurfacePanel({
	width = 'md',
	className,
	...props
}: SurfacePanelProps) {
	return (
		<section
			className={cn(
				'w-full rounded-[28px] border border-slate-300 bg-white/94 p-6 shadow-[0_24px_54px_rgba(15,23,42,0.14)]',
				SURFACE_WIDTH_CLASSES[width],
				className,
			)}
			{...props}
		/>
	)
}
