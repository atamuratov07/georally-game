import { motion } from 'motion/react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import {
	startTransition,
	useId,
	useOptimistic,
	useState,
	type PointerEvent,
	type ReactNode,
} from 'react'
import { cn } from '@/shared/utils'

export type SettingTone = 'ocean' | 'grass' | 'sunflower' | 'coral' | 'grape'

export interface SettingOption<TValue extends string | number> {
	value: TValue
	label: ReactNode
	tone?: SettingTone
	disabled?: boolean
}

const THUMB_TONES: Record<SettingTone, string> = {
	ocean: 'border-ocean-600 bg-ocean-500 [--edge:var(--color-ocean-700)]',
	grass: 'border-grass-600 bg-grass-500 [--edge:var(--color-grass-700)]',
	sunflower:
		'border-sunflower-500 bg-sunflower-400 [--edge:var(--color-sunflower-600)]',
	coral: 'border-coral-600 bg-coral-500 [--edge:var(--color-coral-700)]',
	grape: 'border-grape-600 bg-grape-500 [--edge:var(--color-grape-700)]',
}

const ENABLED_OPTION = '[data-option]:not(:disabled)'

interface SettingToggleGroupProps<TValue extends string | number> {
	label: string
	value: TValue
	options: readonly SettingOption<TValue>[]
	onChange: (value: TValue) => void
	tone?: SettingTone
	cumulative?: boolean
}

interface Drag {
	pointerId: number
	value: string
}

function nearestOption(root: HTMLElement, clientX: number): string | null {
	let nearest: string | null = null
	let nearestDistance = Infinity
	for (const item of root.querySelectorAll<HTMLElement>(ENABLED_OPTION)) {
		const { left, right } = item.getBoundingClientRect()
		const distance = Math.max(left - clientX, clientX - right, 0)
		if (distance < nearestDistance) {
			nearest = item.dataset.option ?? null
			nearestDistance = distance
		}
	}
	return nearest
}

export function SettingToggleGroup<TValue extends string | number>({
	label,
	value,
	options,
	onChange,
	tone = 'ocean',
	cumulative = false,
}: SettingToggleGroupProps<TValue>) {
	const labelId = useId()
	const [drag, setDrag] = useState<Drag | null>(null)
	// The router applies a new value as a transition, a render later; shown
	// optimistically, the highlight doesn't fall back to the old one meanwhile.
	const [selected, setSelected] = useOptimistic(String(value))
	const shown = drag?.value ?? selected
	const shownIndex = options.findIndex(item => String(item.value) === shown)
	const shownTone = options[shownIndex]?.tone ?? tone

	function commit(next: string) {
		const option = options.find(item => String(item.value) === next)
		if (!option || option.disabled || next === selected) return
		startTransition(() => {
			setSelected(next)
			onChange(option.value)
		})
	}

	function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
		if (event.button !== 0) return
		const item = (event.target as Element).closest<HTMLElement>(
			ENABLED_OPTION,
		)
		if (!item?.dataset.option) return
		event.currentTarget.setPointerCapture(event.pointerId)
		setDrag({
			pointerId: event.pointerId,
			value: item.dataset.option,
		})
	}

	function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
		if (drag?.pointerId !== event.pointerId) return
		const next = nearestOption(event.currentTarget, event.clientX)
		if (next && next !== drag.value) {
			setDrag({ ...drag, value: next })
		}
	}

	function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
		if (drag?.pointerId !== event.pointerId) return
		commit(drag.value)
		setDrag(null)
	}

	return (
		<div className='flex flex-col gap-2'>
			<span id={labelId} className='text-sm font-extrabold text-muted'>
				{label}
			</span>
			<ToggleGroupPrimitive.Root
				type='single'
				aria-labelledby={labelId}
				value={selected}
				onValueChange={commit}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={() => setDrag(null)}
				className='grid w-full touch-pan-y auto-cols-fr grid-flow-col gap-1 rounded-control bg-paper-deep p-1 pb-1.5 shadow-[inset_0_2px_0_0_var(--color-line)] select-none'
			>
				{shownIndex >= 0 ? (
					<motion.span
						layout
						aria-hidden='true'
						style={{
							gridRow: 1,
							gridColumn: `${cumulative ? 1 : shownIndex + 1} / ${shownIndex + 2}`,
						}}
						className={cn(
							'pointer-events-none rounded-[10px] border-2 shadow-[0_3px_0_0_var(--edge)]',
							drag && '-m-1',
							THUMB_TONES[shownTone],
						)}
						transition={{ type: 'spring', stiffness: 520, damping: 34 }}
					/>
				) : null}
				{options.map((option, index) => {
					const lit = cumulative
						? index <= shownIndex
						: index === shownIndex

					return (
						<ToggleGroupPrimitive.Item
							key={String(option.value)}
							value={String(option.value)}
							data-option={String(option.value)}
							disabled={option.disabled}
							style={{ gridRow: 1, gridColumn: index + 1 }}
							className={cn(
								'relative h-10 min-w-0 rounded-[10px] px-2 text-sm font-extrabold whitespace-nowrap text-muted transition-colors duration-150 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted sm:text-base',
								lit && 'text-white hover:text-white',
								lit &&
									shownTone === 'sunflower' &&
									'text-ink hover:text-ink',
							)}
						>
							{option.label}
						</ToggleGroupPrimitive.Item>
					)
				})}
			</ToggleGroupPrimitive.Root>
		</div>
	)
}
