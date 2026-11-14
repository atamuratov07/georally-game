import type { GameScope } from '@georally/game-domain'
import { X } from 'lucide-react'
import { useId, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getScopeLabel } from '@/shared/i18n'
import { cn } from '@/shared/utils'
import { REGION_MAP_VIEWBOX, REGION_PATHS } from 'virtual:region-map'

type Continent = keyof typeof REGION_PATHS

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

interface RegionPickerProps {
	label: string
	value: GameScope
	onChange: (scope: GameScope) => void
}

/** Continents are keyboard-focusable radio items, so the map needs no separate list. */
export function RegionPicker({ label, value, onChange }: RegionPickerProps) {
	const { t } = useTranslation()
	const labelId = useId()
	const [hovered, setHovered] = useState<Continent | null>(null)
	const isWorld = value === 'all'

	function select(continent: Continent) {
		onChange(value === continent ? 'all' : continent)
	}

	function handleKeyDown(
		event: KeyboardEvent<SVGPathElement>,
		continent: Continent,
	) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			select(continent)
		}
	}

	function faceClass(continent: Continent): string {
		const isSelected = isWorld || value === continent
		const isHovered = hovered === continent

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
				{CONTINENTS.map(continent => (
					<path
						key={continent}
						aria-hidden='true'
						d={REGION_PATHS[continent]}
						transform={`translate(0 ${EDGE_DEPTH})`}
						className={cn(
							'pointer-events-none transition-[opacity,filter] duration-200',
							CONTINENT_COLORS[continent].edge,
							!isWorld &&
								value !== continent &&
								hovered !== continent &&
								'opacity-45 grayscale',
						)}
					/>
				))}
				{CONTINENTS.map(continent => (
					<path
						key={continent}
						role='radio'
						tabIndex={0}
						aria-checked={value === continent}
						aria-label={getScopeLabel(t, continent)}
						d={REGION_PATHS[continent]}
						strokeWidth={1.5}
						strokeLinejoin='round'
						className={cn(
							'cursor-pointer stroke-white transition-[translate,opacity,filter] duration-200 outline-none',
							'focus-visible:stroke-ink focus-visible:[stroke-width:3]',
							CONTINENT_COLORS[continent].face,
							faceClass(continent),
						)}
						onMouseEnter={() => setHovered(continent)}
						onFocus={() => setHovered(continent)}
						onBlur={() => setHovered(null)}
						onClick={() => select(continent)}
						onKeyDown={event => handleKeyDown(event, continent)}
					/>
				))}
			</svg>

			<div className='flex min-h-10 items-center justify-center'>
				{isWorld ? (
					<span className='text-lg font-black text-ink'>
						{getScopeLabel(t, 'all')}
					</span>
				) : (
					<span
						className={cn(
							'inline-flex items-center gap-1 rounded-full py-1 pr-1 pl-4 text-base font-extrabold text-white sm:text-sm',
							CONTINENT_COLORS[value].chip,
						)}
					>
						{getScopeLabel(t, value)}
						<button
							type='button'
							aria-label={getScopeLabel(t, 'all')}
							title={getScopeLabel(t, 'all')}
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
