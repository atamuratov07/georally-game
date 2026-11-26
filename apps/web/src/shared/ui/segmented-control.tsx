import { motion } from 'motion/react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import {
	startTransition,
	useOptimistic,
	useState,
	type PointerEvent,
	type ReactNode,
} from 'react'
import { cn } from '@/shared/utils'
import { LIT_TONES, type ControlTone } from './tones'

export interface SegmentOption<TValue extends string | number> {
	value: TValue
	label: ReactNode
	tone?: ControlTone
	disabled?: boolean
}

// Small ones are pills, for a control floating over a map or a picture.
const SIZES = {
	md: {
		track: 'rounded-control',
		round: 'rounded-[10px]',
		segment: 'h-10 px-2 sm:text-base',
	},
	sm: { track: 'rounded-full', round: 'rounded-full', segment: 'h-8 px-3.5' },
}

const ENABLED_OPTION = '[data-option]:not(:disabled)'

interface SegmentedControlProps<TValue extends string | number> {
	value: TValue
	options: readonly SegmentOption<TValue>[]
	onChange: (value: TValue) => void
	tone?: ControlTone
	cumulative?: boolean // lights every option up to the chosen one
	size?: 'md' | 'sm'
	className?: string // the track's surface
	'aria-label'?: string
	'aria-labelledby'?: string
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

export function SegmentedControl<TValue extends string | number>({
	value,
	options,
	onChange,
	tone = 'ocean',
	cumulative = false,
	size = 'md',
	className,
	...aria
}: SegmentedControlProps<TValue>) {
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
		<ToggleGroupPrimitive.Root
			type='single'
			{...aria}
			value={selected}
			onValueChange={commit}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={() => setDrag(null)}
			className={cn(
				'grid w-full touch-pan-y auto-cols-fr grid-flow-col gap-1 bg-paper-deep p-1 pb-1.5 shadow-[inset_0_2px_0_0_var(--color-line)] select-none',
				SIZES[size].track,
				className,
			)}
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
						'pointer-events-none border-2 shadow-[0_3px_0_0_var(--edge)]',
						SIZES[size].round,
						drag && '-m-1',
						LIT_TONES[shownTone],
					)}
					transition={{ type: 'spring', stiffness: 520, damping: 34 }}
				/>
			) : null}
			{options.map((option, index) => {
				const lit = cumulative ? index <= shownIndex : index === shownIndex

				return (
					<ToggleGroupPrimitive.Item
						key={String(option.value)}
						value={String(option.value)}
						data-option={String(option.value)}
						disabled={option.disabled}
						style={{ gridRow: 1, gridColumn: index + 1 }}
						className={cn(
							'relative min-w-0 text-sm font-extrabold whitespace-nowrap text-muted transition-colors duration-150 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted',
							SIZES[size].round,
							SIZES[size].segment,
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
	)
}
