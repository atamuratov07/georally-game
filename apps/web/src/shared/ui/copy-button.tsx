import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { copyText } from '@/shared/lib/clipboard'
import { Button, type ButtonProps } from './button'

export interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
	textToCopy: string
	resetDelayMs?: number
}

export function CopyButton({
	textToCopy,
	children,
	resetDelayMs = 1600,
	variant = 'neutral',
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
		resetTimerRef.current = window.setTimeout(() => {
			setCopied(false)
			resetTimerRef.current = null
		}, resetDelayMs)
	}

	return (
		<Button
			type='button'
			variant={copied ? 'grass' : variant}
			onClick={() => {
				void handleCopy()
			}}
			{...props}
		>
			{copied ? <Check aria-hidden='true' /> : <Copy aria-hidden='true' />}
			{children}
		</Button>
	)
}
