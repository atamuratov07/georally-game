import {
	normalizeRegions,
	type GameContinent,
	type GameRegions,
} from '@georally/game-domain'
import { X } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { getRegionLabel } from '@/shared/i18n'
import { cn } from '@/shared/utils'
import { ContinentMap } from './ContinentMap'
import { CONTINENT_COLORS, CONTINENTS, type RegionOption } from './continents'

interface RegionMapPickerProps<Region extends string> {
	label: string
	/** Empty means the whole world. */
	value: readonly Region[]
	/** Continents in no option are drawn as land that can't be picked. */
	options: readonly RegionOption<Region>[]
	labelOf: (region: Region) => string
	worldLabel: string
	onChange: (regions: Region[]) => void
}

const GAME_REGION_OPTIONS: readonly RegionOption<GameContinent>[] =
	CONTINENTS.map(continent => ({ value: continent, continents: [continent] }))

interface RegionPickerProps {
	label: string
	value: GameRegions
	onChange: (regions: GameContinent[]) => void
}

export function RegionPicker({ label, value, onChange }: RegionPickerProps) {
	const { t } = useTranslation()

	return (
		<RegionMapPicker<GameContinent>
			label={label}
			value={value}
			options={GAME_REGION_OPTIONS}
			labelOf={region => getRegionLabel(t, region)}
			worldLabel={getRegionLabel(t, 'all')}
			onChange={onChange}
		/>
	)
}

export function RegionMapPicker<Region extends string>({
	label,
	value,
	options,
	labelOf,
	worldLabel,
	onChange,
}: RegionMapPickerProps<Region>) {
	const { t } = useTranslation()
	const labelId = useId()
	const hintId = useId()
	const isWorld = value.length === 0
	const order = options.map(option => option.value)
	const picked = options.filter(option => value.includes(option.value))
	const colorsOf = (option: RegionOption<Region>) =>
		CONTINENT_COLORS[option.continents[0]]

	function change(next: Region[]) {
		onChange(normalizeRegions(next, order))
	}

	function toggle(region: Region) {
		if (isWorld) change([region])
		else if (value.includes(region)) {
			change(value.filter(item => item !== region))
		} else change([...value, region])
	}

	return (
		<div className='flex flex-col gap-2'>
			<div className='flex items-baseline justify-between gap-3'>
				<span id={labelId} className='text-sm font-extrabold text-muted'>
					{label}
				</span>
				{value.length >= 2 ? (
					<button
						type='button'
						onClick={() => change([])}
						className='-my-1 inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-xs font-extrabold text-coral-600 transition-colors hover:text-coral-700'
					>
						<X
							aria-hidden='true'
							className='size-3.5'
							strokeWidth={3.5}
						/>
						{t('settings.clearRegions')}
					</button>
				) : (
					<span id={hintId} className='text-xs font-bold text-muted/80'>
						{t('settings.regionsHint')}
					</span>
				)}
			</div>

			<ContinentMap
				labelledBy={labelId}
				describedBy={value.length >= 2 ? undefined : hintId}
				options={options}
				stateOf={region =>
					isWorld || value.includes(region) ? 'on' : 'off'
				}
				labelOf={labelOf}
				onToggle={toggle}
				onBackgroundClick={() => change([])}
			/>

			<div
				aria-live='polite'
				className='-mx-2.5 flex min-h-9 snap-x scroll-px-2.5 items-center gap-1.5 overflow-x-auto px-2.5 py-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden'
			>
				{isWorld ? (
					<span className='mx-auto text-base font-black text-ink sm:text-lg'>
						{worldLabel}
					</span>
				) : (
					picked.map(option => (
						<span
							key={option.value}
							className={cn(
								'raised inline-flex shrink-0 snap-start items-center gap-0.5 rounded-full py-0.5 pr-0.5 pl-2.5 text-xs font-extrabold whitespace-nowrap text-white [--edge-size:2px] [--edge:rgb(0_0_0/0.18)] first:ml-auto last:mr-auto sm:pl-3 sm:text-sm',
								colorsOf(option).chip,
							)}
						>
							{labelOf(option.value)}
							<button
								type='button'
								aria-label={`${labelOf(option.value)}: ${t('common.remove')}`}
								onClick={() => toggle(option.value)}
								className='relative grid size-5 place-items-center rounded-full transition-colors after:absolute after:-inset-2 hover:bg-white/20 sm:size-6'
							>
								<X
									aria-hidden='true'
									className='size-3 sm:size-3.5'
									strokeWidth={3.5}
								/>
							</button>
						</span>
					))
				)}
			</div>
		</div>
	)
}
