import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../utils'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	active?: boolean
}

export function IconButton({
	active = false,
	className,
	disabled,
	...props
}: IconButtonProps) {
	return (
		<button
			className={cn(
				'button-3d inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl',
				active
					? 'button-3d-soft bg-gray-500 text-slate-100'
					: 'button-3d-sky bg-sky-500 text-white',
				active ? 'button-3d-active' : '',
				disabled
					? active
						? 'cursor-default'
						: 'cursor-not-allowed opacity-50'
					: 'cursor-pointer',
				className,
			)}
			disabled={disabled}
			{...props}
		/>
	)
}
