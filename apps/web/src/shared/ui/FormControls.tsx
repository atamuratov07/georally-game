import type {
	InputHTMLAttributes,
	ReactNode,
	SelectHTMLAttributes,
} from 'react'
import { cn } from '../utils'

export type FieldAccent = 'amber' | 'teal'
export type FieldTone = 'light' | 'dark'

const FIELD_ACCENT_CLASSES: Record<FieldAccent, string> = {
	amber: 'focus:border-amber-500 focus:ring-2 focus:ring-amber-200',
	teal: 'focus:border-teal-600 focus:ring-2 focus:ring-teal-300',
}

const FIELD_TONE_CLASSES: Record<FieldTone, string> = {
	light: 'border-slate-300 bg-white text-slate-900',
	dark: 'border-slate-700 bg-slate-900 text-white',
}

interface FieldProps {
	label: ReactNode
	children: ReactNode
	className?: string
	labelClassName?: string
}

export function Field({
	label,
	children,
	className,
	labelClassName,
}: FieldProps) {
	return (
		<label className={cn('block', className)}>
			<span
				className={cn(
					'mb-2 block text-sm font-semibold text-slate-800',
					labelClassName,
				)}
			>
				{label}
			</span>
			{children}
		</label>
	)
}

function getControlClassName({
	accent,
	tone,
	className,
}: {
	accent: FieldAccent
	tone: FieldTone
	className?: string
}): string {
	return cn(
		'w-full rounded-xl border px-3 py-2.5 outline-none transition',
		FIELD_TONE_CLASSES[tone],
		FIELD_ACCENT_CLASSES[accent],
		className,
	)
}

export interface TextInputProps
	extends InputHTMLAttributes<HTMLInputElement> {
	accent?: FieldAccent
	tone?: FieldTone
}

export function TextInput({
	accent = 'amber',
	tone = 'light',
	className,
	...props
}: TextInputProps) {
	return (
		<input
			className={getControlClassName({ accent, tone, className })}
			{...props}
		/>
	)
}

export interface SelectControlProps
	extends SelectHTMLAttributes<HTMLSelectElement> {
	accent?: FieldAccent
	tone?: FieldTone
}

export function SelectControl({
	accent = 'amber',
	tone = 'light',
	className,
	...props
}: SelectControlProps) {
	return (
		<select
			className={getControlClassName({ accent, tone, className })}
			{...props}
		/>
	)
}
