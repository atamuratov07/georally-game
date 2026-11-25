import type { GameScope } from '@georally/game-domain'
import type { MasteryCount, MasterySummary } from '@georally/mastery'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { getRegionLabel } from '@/shared/i18n'
import { cn } from '@/shared/utils'
import {
	CONTINENT_COLORS,
	CONTINENTS,
	type Continent,
} from '@/shared/widgets/region-map/continents'
import { outlinedText } from '@/shared/widgets/outlinedText'
import {
	REGION_MAP_VIEWBOX,
	REGION_PATHS,
	REGION_SHAPES,
} from 'virtual:region-map'

const SHAPE_WIDTH = 128
const SHAPE_HEIGHT = 88
const EDGE_PX = 4
const SCOPES: readonly GameScope[] = ['all', ...CONTINENTS]
const GREY = { face: 'fill-[#a7b1c2]', edge: 'fill-[#6f7b91]' }
const COUNT_TEXT = outlinedText(0.18, 0.12, 'em')
const SPRING = { type: 'spring', stiffness: 420, damping: 18 } as const

function edgeOffset(viewBox: string) {
	const [, , width, height] = viewBox.split(' ').map(Number)
	return EDGE_PX * Math.max(width / SHAPE_WIDTH, height / SHAPE_HEIGHT)
}

function Shape({ scope, lit }: { scope: GameScope; lit: boolean }) {
	const viewBox =
		scope === 'all' ? REGION_MAP_VIEWBOX : REGION_SHAPES[scope].viewBox
	const parts: readonly [Continent, string][] =
		scope === 'all'
			? CONTINENTS.map(continent => [continent, REGION_PATHS[continent]])
			: [[scope, REGION_SHAPES[scope].path]]
	const offset = edgeOffset(viewBox)
	const colors = (continent: Continent) =>
		lit ? CONTINENT_COLORS[continent] : GREY

	return (
		<svg
			aria-hidden='true'
			viewBox={viewBox}
			width={SHAPE_WIDTH}
			height={SHAPE_HEIGHT}
			className='overflow-visible'
		>
			{parts.map(([continent, path]) => (
				<path
					key={`edge-${continent}`}
					d={path}
					transform={`translate(0 ${offset})`}
					className={cn('transition-colors', colors(continent).edge)}
				/>
			))}
			{parts.map(([continent, path]) => (
				<path
					key={continent}
					d={path}
					strokeWidth={2}
					strokeLinejoin='round'
					vectorEffect='non-scaling-stroke'
					className={cn(
						'stroke-white transition-colors',
						colors(continent).face,
					)}
				/>
			))}
		</svg>
	)
}

function Counter({ count }: { count: MasteryCount }) {
	return (
		<span
			aria-hidden='true'
			className='absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-black whitespace-nowrap text-white tabular-nums'
			style={COUNT_TEXT}
		>
			<span className='text-2xl'>{count.known}</span>
			<span className='text-sm'>/{count.total}</span>
		</span>
	)
}

export function ContinentCounters({
	summary,
	focus,
	onFocus,
}: {
	summary: MasterySummary
	focus: GameScope
	onFocus: (focus: GameScope) => void
}) {
	const { t } = useTranslation()

	return (
		<div className='snap-x scroll-px-4 overflow-x-auto pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] [scrollbar-width:none]'>
			<div className='mx-auto flex w-max gap-5 px-4'>
				{SCOPES.map(scope => {
					const chosen = scope === focus
					const label = getRegionLabel(t, scope)
					const { known, total } = summary[scope]
					return (
						<motion.button
							key={scope}
							type='button'
							aria-pressed={chosen}
							aria-label={`${label}: ${known}/${total}`}
							onClick={event => {
								event.currentTarget.scrollIntoView({
									behavior: 'smooth',
									inline: 'center',
									block: 'nearest',
								})
								onFocus(scope)
							}}
							className='flex w-32 shrink-0 snap-start flex-col items-center outline-none focus-visible:[&_svg]:drop-shadow-[0_0_3px_var(--color-ocean-500)]'
							animate={{
								scale: chosen ? 1.1 : 0.92,
								y: chosen ? -4 : 0,
							}}
							whileTap={{ scale: chosen ? 1.04 : 0.86 }}
							transition={SPRING}
						>
							<span className='relative'>
								<Shape scope={scope} lit={chosen} />
								{chosen ? null : <Counter count={summary[scope]} />}
							</span>
						</motion.button>
					)
				})}
			</div>
		</div>
	)
}
