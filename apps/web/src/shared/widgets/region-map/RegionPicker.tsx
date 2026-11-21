import type { GameScope } from '@georally/game-domain'
import { X } from 'lucide-react'
import { useId, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getScopeLabel } from '@/shared/i18n'
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

export interface RegionOption<Scope extends string> {
	value: Scope
	continents: readonly Continent[]
}

interface RegionMapPickerProps<Scope extends string> {
	label: string
	value: Scope | 'all'
	/** Continents in no option are drawn as land that can't be picked. */
	options: readonly RegionOption<Scope>[]
	labelOf: (scope: Scope | 'all') => string
	onChange: (scope: Scope | 'all') => void
}

const GAME_SCOPE_OPTIONS: readonly RegionOption<Continent>[] = CONTINENTS.map(
	continent => ({ value: continent, continents: [continent] }),
)

interface RegionPickerProps {
	label: string
	value: GameScope
	onChange: (scope: GameScope) => void
}

export function RegionPicker({ label, value, onChange }: RegionPickerProps) {
	const { t } = useTranslation()

	return (
		<RegionMapPicker<Continent>
			label={label}
			value={value}
			options={GAME_SCOPE_OPTIONS}
			labelOf={scope => getScopeLabel(t, scope)}
			onChange={onChange}
		/>
	)
}

/** Each option is a keyboard-focusable radio item, so the map needs no separate list. */
export function RegionMapPicker<Scope extends string>({
	label,
	value,
	options,
	labelOf,
	onChange,
}: RegionMapPickerProps<Scope>) {
	const labelId = useId()
	const [hovered, setHovered] = useState<Scope | null>(null)
	const isWorld = value === 'all'
	const selected = options.find(option => option.value === value)
	const optionOf = (continent: Continent) =>
		options.find(option => option.continents.includes(continent))
	const colorsOf = (option: RegionOption<Scope>) =>
		CONTINENT_COLORS[option.continents[0]]

	function select(scope: Scope) {
		onChange(value === scope ? 'all' : scope)
	}

	function handleKeyDown(event: KeyboardEvent<SVGGElement>, scope: Scope) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			select(scope)
		}
	}

	function isDimmed(option: RegionOption<Scope> | undefined): boolean {
		return (
			!option ||
			(!isWorld && value !== option.value && hovered !== option.value)
		)
	}

	function faceClass(scope: Scope): string {
		const isSelected = isWorld || value === scope
		const isHovered = hovered === scope

		if (isSelected) {
			return isHovered ? '-translate-y-1' : ''
		}
		return isHovered
			? 'translate-y-0.5 opacity-80'
			: 'translate-y-1 opacity-45 grayscale'
	}

	return (
		<div className='flex flex-col gap-2'>
			<span id={labelId} className='text-sm font-extrabold text-muted'>
				{label}
			</span>

			<svg
				role='radiogroup'
				aria-labelledby={labelId}
				viewBox={REGION_MAP_VIEWBOX}
				className='-mx-1 h-auto w-[calc(100%+0.5rem)] overflow-visible sm:mx-0 sm:w-full'
				onMouseLeave={() => setHovered(null)}
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
						role='radio'
						tabIndex={0}
						aria-checked={value === option.value}
						aria-label={labelOf(option.value)}
						className={cn(
							'cursor-pointer transition-[translate,opacity,filter] duration-200 outline-none',
							'focus-visible:[&>path]:stroke-ink focus-visible:[&>path]:[stroke-width:3]',
							faceClass(option.value),
						)}
						onMouseEnter={() => setHovered(option.value)}
						onFocus={() => setHovered(option.value)}
						onBlur={() => setHovered(null)}
						onClick={() => select(option.value)}
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

			<div className='flex min-h-10 items-center justify-center'>
				{isWorld || !selected ? (
					<span className='text-lg font-black text-ink'>
						{labelOf('all')}
					</span>
				) : (
					<span
						className={cn(
							'inline-flex items-center gap-1 rounded-full py-1 pr-1 pl-4 text-base font-extrabold text-white sm:text-sm',
							colorsOf(selected).chip,
						)}
					>
						{labelOf(selected.value)}
						<button
							type='button'
							aria-label={labelOf('all')}
							title={labelOf('all')}
							onClick={() => onChange('all')}
							className='grid size-9 place-items-center rounded-full transition-colors hover:bg-white/20 sm:size-7'
						>
							<X
								aria-hidden='true'
								className='size-5 sm:size-4'
								strokeWidth={3}
							/>
						</button>
					</span>
				)}
			</div>
		</div>
	)
}
