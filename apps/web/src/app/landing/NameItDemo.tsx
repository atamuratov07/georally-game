import { geoMercator, geoPath } from 'd3-geo'
import type { FeatureCollection, Geometry } from 'geojson'
import { Check, Mic } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { feature } from 'topojson-client'
import type { GeometryCollection } from 'topojson-specification'
import world from 'world-atlas/countries-110m.json'
import { useCurrentLocale } from '@/app/LocaleContext'
import { defaultSpeechLanguage } from '@/shared/answers/speechLanguage'
import {
	REVEALED_FILL,
	SELECTION_EDGE,
	SELECTION_FILL,
	WATER_FILL,
} from '@/shared/map/map-styles'
import { cn } from '@/shared/utils'

const ROUNDS = [
	{ id: '380', code: 'IT', points: 94, voice: false },
	{ id: '392', code: 'JP', points: 88, voice: true },
	{ id: '036', code: 'AU', points: 91, voice: false },
	{ id: '076', code: 'BR', points: 83, voice: true },
	{ id: '356', code: 'IN', points: 97, voice: false },
	{ id: '826', code: 'GB', points: 86, voice: true },
] as const

const TICK_MS = 90
const LISTEN_TICKS = 10
const DONE_TICKS = 18
const VIEW = { width: 360, height: 220, pad: 24 }
const QUESTION_COUNT = 10

const countries = feature(
	world,
	world.objects.countries as GeometryCollection,
) as FeatureCollection<Geometry>

const SHAPES = ROUNDS.map(round => {
	const shape = countries.features.find(country => country.id === round.id)
	if (!shape) {
		return ''
	}
	const projection = geoMercator().fitExtent(
		[
			[VIEW.pad, VIEW.pad],
			[VIEW.width - VIEW.pad, VIEW.height - VIEW.pad],
		],
		shape,
	)
	return geoPath(projection)(shape) ?? ''
})

function regionName(locale: string, code: string): string {
	try {
		return (
			new Intl.DisplayNames([locale.split('-')[0], 'en'], {
				type: 'region',
			}).of(code) ?? code
		)
	} catch {
		return code
	}
}

export default function NameItDemo() {
	const { t } = useTranslation()
	const locale = useCurrentLocale()
	const reduceMotion = useReducedMotion()
	const [tick, setTick] = useState(0)
	const voiceOn = defaultSpeechLanguage(locale) !== null

	const names = useMemo(
		() => ROUNDS.map(round => regionName(locale, round.code)),
		[locale],
	)
	const answerTicks = ROUNDS.map((round, index) =>
		round.voice && voiceOn ? LISTEN_TICKS : names[index].length,
	)
	const cycleTicks = answerTicks.reduce(
		(sum, ticks) => sum + ticks + DONE_TICKS,
		0,
	)

	useEffect(() => {
		if (reduceMotion) {
			return
		}
		const timer = setInterval(() => setTick(value => value + 1), TICK_MS)
		return () => clearInterval(timer)
	}, [reduceMotion])

	let position = reduceMotion ? answerTicks[0] : tick % cycleTicks
	let index = 0
	while (position >= answerTicks[index] + DONE_TICKS) {
		position -= answerTicks[index] + DONE_TICKS
		index += 1
	}

	const round = ROUNDS[index]
	const name = names[index]
	const byVoice = round.voice && voiceOn
	const answering = position < answerTicks[index]
	const listening = byVoice && answering
	const shown = byVoice ? (answering ? '' : name) : name.slice(0, position)
	const timeLeft =
		1 - (Math.min(position, answerTicks[index]) / answerTicks[index]) * 0.55

	return (
		<div
			aria-hidden='true'
			className='relative mx-auto w-full max-w-md select-none'
		>
			<div
				className='raised overflow-hidden rounded-[28px] border-2 border-ocean-200 [--edge:var(--color-ocean-300)]'
				style={{ backgroundColor: WATER_FILL }}
			>
				<div className='h-2 bg-ink/10'>
					<div
						className={cn(
							'h-full rounded-r-full transition-[width,background-color] duration-100 ease-linear',
							timeLeft > 0.6 ? 'bg-grass-500' : 'bg-sunflower-500',
						)}
						style={{ width: `${timeLeft * 100}%` }}
					/>
				</div>

				<div className='flex justify-end px-3 pt-3'>
					<span className='raised grid h-9 min-w-9 place-items-center rounded-full border-2 border-line-strong bg-white px-3 text-sm font-black text-ink tabular-nums [--edge-size:3px] [--edge:var(--color-line-strong)]'>
						{index + 1}/{QUESTION_COUNT}
					</span>
				</div>

				<div className='relative aspect-[360/220]'>
					<AnimatePresence initial={false}>
						<motion.svg
							key={index}
							viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
							className='absolute inset-0 size-full'
							initial={{ scale: 0.4, opacity: 0, rotate: -10 }}
							animate={{ scale: 1, opacity: 1, rotate: 0 }}
							exit={{ scale: 0.7, opacity: 0, rotate: 8 }}
							transition={{
								type: 'spring',
								stiffness: 320,
								damping: 20,
							}}
						>
							<path
								d={SHAPES[index]}
								fill={answering ? SELECTION_FILL : REVEALED_FILL}
								stroke={answering ? SELECTION_EDGE : '#2a7a16'}
								strokeWidth={2.5}
								strokeLinejoin='round'
								className='transition-[fill,stroke] duration-300'
							/>
						</motion.svg>
					</AnimatePresence>

					<AnimatePresence>
						{answering ? null : (
							<motion.span
								key={`points-${index}`}
								className='absolute top-1 right-6 text-4xl font-black text-sunflower-300 [-webkit-text-stroke:6px_var(--color-ink)] [paint-order:stroke_fill] [text-shadow:0_5px_0_var(--color-ink)]'
								initial={{ y: 16, opacity: 0, scale: 0.5 }}
								animate={{ y: 0, opacity: 1, scale: 1 }}
								exit={{ y: -12, opacity: 0 }}
								transition={{
									type: 'spring',
									stiffness: 420,
									damping: 18,
								}}
							>
								+{round.points}
							</motion.span>
						)}
					</AnimatePresence>
				</div>

				<div className='px-4 pb-5'>
					<div
						className={cn(
							'raised flex h-14 items-center gap-2 rounded-card border-2 bg-white pr-2 pl-4 transition-colors duration-200 [--edge-size:4px]',
							answering
								? 'border-line [--edge:var(--color-line-strong)]'
								: 'border-grass-500 [--edge:var(--color-grass-600)]',
						)}
					>
						<span
							className={cn(
								'min-w-0 flex-1 truncate text-lg font-black',
								listening
									? 'text-ocean-600'
									: answering
										? 'text-ink'
										: 'text-grass-600',
							)}
						>
							{listening ? t('nameIt.mic.listening') : shown}
							{answering && !listening ? (
								<span className='ml-0.5 inline-block h-5 w-0.5 translate-y-0.5 animate-caret-blink bg-ink' />
							) : null}
						</span>
						{answering ? null : (
							<Check
								className='size-6 shrink-0 text-grass-600'
								strokeWidth={3}
							/>
						)}
						{voiceOn ? (
							<span
								className={cn(
									'relative grid size-10 shrink-0 place-items-center rounded-control text-white transition-colors',
									listening ? 'bg-coral-500' : 'bg-ocean-500',
								)}
							>
								{listening ? (
									<span className='absolute inset-0 animate-ping rounded-control bg-coral-400/60' />
								) : null}
								<Mic className='relative size-5' />
							</span>
						) : null}
					</div>
				</div>
			</div>
		</div>
	)
}
