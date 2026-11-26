import { useId } from 'react'
import {
	SegmentedControl,
	type ControlTone,
	type SegmentOption,
} from '@/shared/ui'

interface SettingToggleGroupProps<TValue extends string | number> {
	label: string
	value: TValue
	options: readonly SegmentOption<TValue>[]
	onChange: (value: TValue) => void
	tone?: ControlTone
	cumulative?: boolean
}

export function SettingToggleGroup<TValue extends string | number>({
	label,
	...control
}: SettingToggleGroupProps<TValue>) {
	const labelId = useId()

	return (
		<div className='flex flex-col gap-2'>
			<span id={labelId} className='text-sm font-extrabold text-muted'>
				{label}
			</span>
			<SegmentedControl aria-labelledby={labelId} {...control} />
		</div>
	)
}
