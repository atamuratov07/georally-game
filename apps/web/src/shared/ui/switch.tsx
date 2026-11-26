import { motion, useReducedMotion } from 'motion/react'
import { Switch as SwitchPrimitive } from 'radix-ui'
import { useState, type ReactNode } from 'react'
import { cn } from '@/shared/utils'
import { LIT_TONES, type ControlTone } from './tones'

const SHAKE = { x: [0, -4, 4, -2, 0] }

export function Switch({
	checked,
	onCheckedChange,
	tone = 'ocean',
	locked = false,
	children,
}: {
	checked: boolean
	onCheckedChange: (checked: boolean) => void
	tone?: ControlTone
	locked?: boolean // can't change; a press shakes it instead
	children: ReactNode
}) {
	const reduceMotion = useReducedMotion()
	const [shakes, setShakes] = useState(0)

	return (
		<label className='flex cursor-pointer items-center gap-2.5 text-base font-extrabold text-ink select-none'>
			<motion.span
				key={shakes}
				className='flex'
				animate={shakes > 0 && !reduceMotion ? SHAKE : undefined}
				transition={{ duration: 0.3 }}
			>
				<SwitchPrimitive.Root
					checked={checked}
					aria-disabled={locked || undefined}
					onCheckedChange={next =>
						locked ? setShakes(shakes + 1) : onCheckedChange(next)
					}
					className={cn(
						'relative flex h-8 w-14 items-center rounded-full border-2 p-0.5 shadow-[0_3px_0_0_var(--edge)] transition-colors duration-200 outline-offset-2',
						checked
							? LIT_TONES[tone]
							: 'border-line-strong bg-paper-deep [--edge:var(--color-line-strong)]',
						checked ? 'justify-end' : 'justify-start',
						locked && 'cursor-not-allowed',
					)}
				>
					<SwitchPrimitive.Thumb asChild>
						<motion.span
							layout
							transition={{
								type: 'spring',
								stiffness: 600,
								damping: 26,
							}}
							className='block size-6 rounded-full bg-white shadow-[0_2px_0_0_rgb(24_34_61/0.25)]'
						/>
					</SwitchPrimitive.Thumb>
				</SwitchPrimitive.Root>
			</motion.span>
			{children}
		</label>
	)
}
