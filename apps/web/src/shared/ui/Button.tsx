import type { ButtonHTMLAttributes } from 'react'
import { type LinkProps } from 'react-router-dom'
import {
	getButtonClassName,
	type ButtonSize,
	type ButtonVariant,
} from './buttonStyles'
import { LocalizedLink } from '../../app/LocalizedLink'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant | 'none'
	size?: ButtonSize
	is3d?: boolean
}

export function Button({
	variant = 'amber',
	size = 'md',
	is3d = false,
	className,
	...props
}: ButtonProps) {
	return (
		<button
			className={getButtonClassName({
				variant,
				size,
				is3d,
				className,
			})}
			{...props}
		/>
	)
}

export interface ButtonLinkProps extends LinkProps {
	variant?: ButtonVariant | 'none'
	size?: ButtonSize
	is3d?: boolean
}

export function ButtonLink({
	variant = 'amber',
	size = 'md',
	is3d = false,
	className,
	...props
}: ButtonLinkProps) {
	return (
		<LocalizedLink
			className={getButtonClassName({
				variant,
				size,
				is3d,
				className,
			})}
			{...props}
		/>
	)
}
