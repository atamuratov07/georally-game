import { CheckIcon, CopyIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button, type ButtonProps } from './Button'

async function copyText(value: string): Promise<boolean> {
	if (navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(value)
			return true
		} catch {
			// Fall through to the textarea fallback for restricted contexts.
		}
	}

	const textarea = document.createElement('textarea')
	textarea.value = value
	textarea.setAttribute('readonly', '')
	textarea.style.position = 'fixed'
	textarea.style.opacity = '0'
	document.body.appendChild(textarea)
	textarea.select()
	const didCopy = document.execCommand('copy')
	document.body.removeChild(textarea)

	return didCopy
}

export interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
	textToCopy: string
	copiedChildren?: ReactNode
	resetDelayMs?: number
}

export function CopyButton({
	textToCopy,
	copiedChildren,
	children,
	resetDelayMs = 1600,
	variant = 'secondary',
	size = 'md',
	...props
}: CopyButtonProps) {
	const [copied, setCopied] = useState(false)
	const resetTimerRef = useRef<number | null>(null)

	useEffect(() => {
		return () => {
			if (resetTimerRef.current !== null) {
				clearTimeout(resetTimerRef.current)
			}
		}
	}, [])

	async function handleCopy() {
		if (resetTimerRef.current !== null) {
			clearTimeout(resetTimerRef.current)
		}

		const didCopy = await copyText(textToCopy)
		setCopied(didCopy)
		resetTimerRef.current = setTimeout(() => {
			setCopied(false)
			resetTimerRef.current = null
		}, resetDelayMs)
	}

	return (
		<Button
			type='button'
			variant={variant}
			size={size}
			onClick={() => {
				void handleCopy()
			}}
			{...props}
		>
			{copied ? (
				<CheckIcon aria-hidden='true' size={18} strokeWidth={2} />
			) : (
				<CopyIcon aria-hidden='true' size={18} strokeWidth={2} />
			)}
			{copied && copiedChildren ? copiedChildren : children}
		</Button>
	)
}
