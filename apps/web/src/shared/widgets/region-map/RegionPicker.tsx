import type { GameScope } from '@georally/game-domain'
import { X } from 'lucide-react'
import { useId, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getScopeLabel } from '@/shared/i18n'
import { cn } from '@/shared/utils'
import { REGION_MAP_VIEWBOX, REGION_PATHS } from 'virtual:region-map'

type Continent = keyof typeof REGION_PATHS

const CONTINENTS = Object.keys(REGION_PATHS) as Continent[]

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

	function fillClass(continent: Continent): string {
		const isSelected = isWorld || value === continent
		const isHovered = hovered === continent

		if (isSelected) {
			return isHovered
				? 'fill-grass-400 stroke-grass-600'
				: 'fill-grass-500 stroke-grass-700'
		}
		return isHovered
			? 'fill-grass-200 stroke-grass-400'
			: 'fill-paper-deep stroke-line-strong'
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
						role='radio'
						tabIndex={0}
						aria-checked={value === continent}
						aria-label={getScopeLabel(t, continent)}
						d={REGION_PATHS[continent]}
						strokeWidth={1.2}
						strokeLinejoin='round'
						className={cn(
							'cursor-pointer transition-[fill,stroke] duration-200 outline-none',
							'focus-visible:stroke-grass-800 focus-visible:[stroke-width:3]',
							fillClass(continent),
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
					<span className='text-lg font-black text-grass-600'>
						{getScopeLabel(t, 'all')}
					</span>
				) : (
					<span className='inline-flex items-center gap-1 rounded-full bg-grass-500 py-1 pr-1 pl-4 text-base font-extrabold text-white sm:text-sm'>
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
