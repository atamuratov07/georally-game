import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/utils'

const CONFIRM_MS = 3000

interface ConfirmButtonProps {
	label: string
	confirmLabel: string
	icon: ReactNode
	onConfirm: () => void
	confirmClassName: string
}

export function ConfirmButton({
	label: idleLabel,
	confirmLabel,
	icon,
	onConfirm,
	confirmClassName,
}: ConfirmButtonProps) {
	const [confirming, setConfirming] = useState(false)
	const areaRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!confirming) {
			return
		}

		const cancel = () => setConfirming(false)
		const handlePointerDown = (event: PointerEvent) => {
			if (!areaRef.current?.contains(event.target as Node)) {
				cancel()
			}
		}
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				cancel()
			}
		}
		const timer = setTimeout(cancel, CONFIRM_MS)
		document.addEventListener('pointerdown', handlePointerDown, true)
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			clearTimeout(timer)
			document.removeEventListener('pointerdown', handlePointerDown, true)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [confirming])

	const label = confirming ? confirmLabel : idleLabel

	return (
		<div ref={areaRef} className='relative'>
			<Button
				type='button'
				size='icon'
				variant={confirming ? 'coral' : 'neutral'}
				aria-label={label}
				title={label}
				onClick={confirming ? onConfirm : () => setConfirming(true)}
			>
				{icon}
			</Button>
			{confirming ? (
				<Button
					type='button'
					size='sm'
					variant='coral'
					className={cn(
						'absolute h-11 animate-pop-in whitespace-nowrap',
						confirmClassName,
					)}
					onClick={onConfirm}
				>
					{confirmLabel}
				</Button>
			) : null}
		</div>
	)
}
