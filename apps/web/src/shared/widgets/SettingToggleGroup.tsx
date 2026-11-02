import { motion } from 'motion/react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import { useId, type ReactNode } from 'react'
import { cn } from '@/shared/utils'

export type SettingTone = 'ocean' | 'grass' | 'sunflower' | 'coral' | 'grape'

export interface SettingOption<TValue extends string | number> {
	value: TValue
	label: ReactNode
	tone?: SettingTone
}

const THUMB_TONES: Record<SettingTone, string> = {
	ocean: 'border-ocean-600 bg-ocean-500 [--edge:var(--color-ocean-700)]',
	grass: 'border-grass-600 bg-grass-500 [--edge:var(--color-grass-700)]',
	sunflower:
		'border-sunflower-500 bg-sunflower-400 [--edge:var(--color-sunflower-600)]',
	coral: 'border-coral-600 bg-coral-500 [--edge:var(--color-coral-700)]',
	grape: 'border-grape-600 bg-grape-500 [--edge:var(--color-grape-700)]',
}

interface SettingToggleGroupProps<TValue extends string | number> {
	label: string
	value: TValue
	options: readonly SettingOption<TValue>[]
	onChange: (value: TValue) => void
	tone?: SettingTone
}

export function SettingToggleGroup<TValue extends string | number>({
	label,
	value,
	options,
	onChange,
	tone = 'ocean',
}: SettingToggleGroupProps<TValue>) {
	const labelId = useId()
	const thumbId = useId()

	return (
		<div className='flex flex-col gap-2'>
			<span id={labelId} className='text-sm font-extrabold text-muted'>
				{label}
			</span>
			<ToggleGroupPrimitive.Root
				type='single'
				aria-labelledby={labelId}
				value={String(value)}
				onValueChange={next => {
					// Radix allows deselecting the active item; keep a value selected.
					const option = options.find(item => String(item.value) === next)
					if (option) onChange(option.value)
				}}
				className='flex w-full gap-1 rounded-control bg-paper-deep p-1 pb-1.5 shadow-[inset_0_2px_0_0_var(--color-line)]'
			>
				{options.map(option => {
					const selected = String(option.value) === String(value)
					const optionTone = option.tone ?? tone

					return (
						<ToggleGroupPrimitive.Item
							key={String(option.value)}
							value={String(option.value)}
							className={cn(
								'relative h-10 min-w-0 flex-1 rounded-[10px] px-2 text-sm font-extrabold whitespace-nowrap text-muted transition-colors duration-150 hover:text-ink sm:text-base',
								selected && 'text-white hover:text-white',
								selected &&
									optionTone === 'sunflower' &&
									'text-ink hover:text-ink',
							)}
						>
							{selected ? (
								<motion.span
									layoutId={thumbId}
									aria-hidden='true'
									className={cn(
										'absolute inset-0 rounded-[10px] border-2 shadow-[0_3px_0_0_var(--edge)]',
										THUMB_TONES[optionTone],
									)}
									transition={{
										type: 'spring',
										stiffness: 520,
										damping: 34,
									}}
								/>
							) : null}
							<span className='relative'>{option.label}</span>
						</ToggleGroupPrimitive.Item>
					)
				})}
			</ToggleGroupPrimitive.Root>
		</div>
	)
}
