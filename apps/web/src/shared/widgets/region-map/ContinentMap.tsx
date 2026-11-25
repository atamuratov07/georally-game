import { useState, type KeyboardEvent } from 'react'
import { cn } from '@/shared/utils'
import { REGION_MAP_VIEWBOX, REGION_PATHS } from 'virtual:region-map'
import {
	CONTINENT_COLORS,
	CONTINENTS,
	type Continent,
	type RegionOption,
} from './continents'

const EDGE_DEPTH = 4

/**
 * on: lit, and lifts on hover.
 * off: dimmed, and lights on hover.
 * raised: lit and lifted.
 * fixed: lit and not pressable.
 */
export type ContinentState = 'on' | 'off' | 'raised' | 'fixed'

interface ContinentMapProps<Region extends string> {
	labelledBy: string
	describedBy?: string
	/** Continents in no option are drawn as land that can't be picked. */
	options: readonly RegionOption<Region>[]
	stateOf: (region: Region) => ContinentState
	labelOf: (region: Region) => string
	onToggle: (region: Region) => void
	onBackgroundClick?: () => void
}

const FACE_CLASSES: Record<ContinentState, { rest: string; hover: string }> = {
	on: { rest: '', hover: '-translate-y-1' },
	off: {
		rest: 'translate-y-1 opacity-45 grayscale',
		hover: 'translate-y-0.5 opacity-80',
	},
	raised: { rest: '-translate-y-1.5', hover: '-translate-y-1.5' },
	fixed: { rest: 'cursor-default', hover: 'cursor-default' },
}

export function ContinentMap<Region extends string>({
	labelledBy,
	describedBy,
	options,
	stateOf,
	labelOf,
	onToggle,
	onBackgroundClick,
}: ContinentMapProps<Region>) {
	const [hovered, setHovered] = useState<Region | null>(null)
	const optionOf = (continent: Continent) =>
		options.find(option => option.continents.includes(continent))
	const colorsOf = (option: RegionOption<Region>) =>
		CONTINENT_COLORS[option.continents[0]]
	const isDimmed = (option: RegionOption<Region> | undefined) =>
		option === undefined ||
		(stateOf(option.value) === 'off' && hovered !== option.value)

	function handleKeyDown(event: KeyboardEvent<SVGGElement>, region: Region) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			onToggle(region)
		}
	}

	return (
		<svg
			role='group'
			aria-labelledby={labelledBy}
			aria-describedby={describedBy}
			viewBox={REGION_MAP_VIEWBOX}
			className='-mx-1 h-auto w-[calc(100%+0.5rem)] overflow-visible sm:mx-0 sm:w-full'
			onMouseLeave={() => setHovered(null)}
			onClick={event => {
				if (!(event.target as Element).closest('[role="checkbox"]')) {
					onBackgroundClick?.()
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
							(option ? colorsOf(option) : CONTINENT_COLORS[continent])
								.edge,
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
			{options.map(option => {
				const state = stateOf(option.value)
				const fixed = state === 'fixed'
				const face = FACE_CLASSES[state]
				return (
					<g
						key={option.value}
						role='checkbox'
						tabIndex={fixed ? undefined : 0}
						aria-checked={state !== 'off'}
						aria-disabled={fixed || undefined}
						aria-label={labelOf(option.value)}
						className={cn(
							'cursor-pointer transition-[translate,opacity,filter] duration-200 outline-none',
							'focus-visible:[&>path]:stroke-ink focus-visible:[&>path]:[stroke-width:3]',
							hovered === option.value ? face.hover : face.rest,
						)}
						onMouseEnter={() => setHovered(option.value)}
						onFocus={() => setHovered(option.value)}
						onBlur={() => setHovered(null)}
						onClick={fixed ? undefined : () => onToggle(option.value)}
						onKeyDown={
							fixed
								? undefined
								: event => handleKeyDown(event, option.value)
						}
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
				)
			})}
		</svg>
	)
}
