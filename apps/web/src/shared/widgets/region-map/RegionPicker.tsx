import {
	normalizeRegions,
	type GameContinent,
	type GameRegions,
} from '@georally/game-domain'
import { X } from 'lucide-react'
import { useId, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getRegionLabel } from '@/shared/i18n'
import { cn } from '@/shared/utils'
import { REGION_MAP_VIEWBOX, REGION_PATHS } from 'virtual:region-map'

export type Continent = keyof typeof REGION_PATHS

const CONTINENTS = Object.keys(REGION_PATHS) as Continent[]

const EDGE_DEPTH = 4

const CONTINENT_COLORS: Record<
	Continent,
	{ face: string; edge: string; chip: string }
> = {
	africa: {
		face: 'fill-[#ff9a1f]',
		edge: 'fill-[#d9690a]',
		chip: 'bg-[#d9690a]',
	},
	asia: {
		face: 'fill-[#ff4f6d]',
		edge: 'fill-[#c92143]',
		chip: 'bg-[#c92143]',
	},
	europe: {
		face: 'fill-[#3d8bff]',
		edge: 'fill-[#1f5bd6]',
		chip: 'bg-[#1f5bd6]',
	},
	'north-america': {
		face: 'fill-[#3fd15c]',
		edge: 'fill-[#20963a]',
		chip: 'bg-[#20963a]',
	},
	'south-america': {
		face: 'fill-[#a45cff]',
		edge: 'fill-[#7432d9]',
		chip: 'bg-[#7432d9]',
	},
	oceania: {
		face: 'fill-[#1fcfc8]',
		edge: 'fill-[#0b918c]',
		chip: 'bg-[#0b918c]',
	},
}

export interface RegionOption<Region extends string> {
	value: Region
	continents: readonly Continent[]
}

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
	const [hovered, setHovered] = useState<Region | null>(null)
	const isWorld = value.length === 0
	const order = options.map(option => option.value)
	const picked = options.filter(option => value.includes(option.value))
	const optionOf = (continent: Continent) =>
		options.find(option => option.continents.includes(continent))
	const colorsOf = (option: RegionOption<Region>) =>
		CONTINENT_COLORS[option.continents[0]]
	const isLit = (option: RegionOption<Region> | undefined) =>
		option !== undefined && (isWorld || value.includes(option.value))

	function change(next: Region[]) {
		onChange(normalizeRegions(next, order))
	}

	function toggle(region: Region) {
		if (isWorld) change([region])
		else if (value.includes(region)) {
			change(value.filter(item => item !== region))
		} else change([...value, region])
	}

	function handleKeyDown(event: KeyboardEvent<SVGGElement>, region: Region) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			toggle(region)
		}
	}

	function isDimmed(option: RegionOption<Region> | undefined): boolean {
		return !isLit(option) && hovered !== option?.value
	}

	function faceClass(option: RegionOption<Region>): string {
		const isHovered = hovered === option.value
		if (isLit(option)) {
			return isHovered ? '-translate-y-1' : ''
		}
		return isHovered
			? 'translate-y-0.5 opacity-80'
			: 'translate-y-1 opacity-45 grayscale'
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

			<svg
				role='group'
				aria-labelledby={labelId}
				aria-describedby={value.length >= 2 ? undefined : hintId}
				viewBox={REGION_MAP_VIEWBOX}
				className='-mx-1 h-auto w-[calc(100%+0.5rem)] overflow-visible sm:mx-0 sm:w-full'
				onMouseLeave={() => setHovered(null)}
				onClick={event => {
					if (!(event.target as Element).closest('[role="checkbox"]')) {
						change([])
					}
				}}
			>
				{CONTINENTS.map(continent => {
					const option = optionOf(continent)
					return (
						<path
							key={continent}
							aria-hidden='true'
							d={REGION_PATHS[continent]}
							transform={`translate(0 ${EDGE_DEPTH})`}
							className={cn(
								'pointer-events-none transition-[opacity,filter] duration-200',
								(option
									? colorsOf(option)
									: CONTINENT_COLORS[continent]
								).edge,
								isDimmed(option) && 'opacity-45 grayscale',
							)}
						/>
					)
				})}
				{CONTINENTS.filter(continent => !optionOf(continent)).map(
					continent => (
						<path
							key={continent}
							aria-hidden='true'
							d={REGION_PATHS[continent]}
							strokeWidth={1.5}
							strokeLinejoin='round'
							className={cn(
								'translate-y-1 stroke-white opacity-45 grayscale',
								CONTINENT_COLORS[continent].face,
							)}
						/>
					),
				)}
				{options.map(option => (
					<g
						key={option.value}
						role='checkbox'
						tabIndex={0}
						aria-checked={value.includes(option.value)}
						aria-label={labelOf(option.value)}
						className={cn(
							'cursor-pointer transition-[translate,opacity,filter] duration-200 outline-none',
							'focus-visible:[&>path]:stroke-ink focus-visible:[&>path]:[stroke-width:3]',
							faceClass(option),
						)}
						onMouseEnter={() => setHovered(option.value)}
						onFocus={() => setHovered(option.value)}
						onBlur={() => setHovered(null)}
						onClick={() => toggle(option.value)}
						onKeyDown={event => handleKeyDown(event, option.value)}
					>
						{option.continents.map(continent => (
							<path
								key={continent}
								d={REGION_PATHS[continent]}
								strokeWidth={1.5}
								strokeLinejoin='round'
								className={cn('stroke-white', colorsOf(option).face)}
							/>
						))}
					</g>
				))}
			</svg>

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
