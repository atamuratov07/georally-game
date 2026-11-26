import {
	animate,
	motion,
	useMotionValue,
	useTransform,
	type MotionValue,
} from 'motion/react'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from '@/app/LocaleContext'
import { MicButton } from '@/game-kit/answering/MicButton'
import { defaultSpeechLanguage } from '@/shared/answers/speechLanguage'
import borderCrossings from '@/shared/map/generated/border-crossings.json'
import { HitRing } from '@/shared/map/HitRing'
import {
	REVEALED_FILL,
	ROUTE_END_FILL,
	ROUTE_UNKNOWN_FILL,
	SELECTION_FILL,
} from '@/shared/map/map-styles'
import { JourneyView } from '@/singleplayer-game/routes/components/JourneyView'
import {
	COUNTRY_FILL,
	NAVY,
	TOURED_CORD,
	TOURED_RIM,
} from '@/singleplayer-game/routes/map/routeLineStyle'
import { DemoField } from './DemoField'
import { DemoMap } from './DemoMap'
import { demoName } from './demoNames'
import { DemoScreen } from './DemoScreen'
import { DEMO_SIZE } from './demoSize'
import { cameraFor, labelPoint, onScreen, project } from './demoWorld'
import { useDemoTicks } from './useDemoTicks'

type Pt = readonly [number, number]

const START = '620'
const TARGET = '616'
const PAR = 3
const CHAIN = [START, '724', '250', '276', TARGET]
const NEAR = new Set(['203'])

const MOVES = [
	{ voice: false, ids: ['724'] },
	{ voice: true, ids: ['203'] },
	{ voice: true, ids: ['250', '276'] },
] as const

// Each link grows from the end the player is building from; `delay` chains
// the links one move reveals together.
const LINKS = [
	{ from: START, to: '724', delay: 0 },
	{ from: '724', to: '250', delay: 0 },
	{ from: '250', to: '276', delay: 0.4 },
	{ from: TARGET, to: '276', delay: 0 },
] as const

const INTRO_TICKS = 12
const LISTEN_TICKS = 16
const AFTER_TICKS = 16
const FINISH_TICKS = 60
const GROW_S = 0.4
const TOUR_S = 2.6
const BEAD_GAP = 22
const LABEL_HALO = '0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff'
const CAMERA = cameraFor([-11, 35, 25, 56], { top: 150, bottom: 120, side: 40 })

const crossings: Readonly<Record<string, readonly number[]>> = borderCrossings
const screenOf = (point: [number, number]): Pt => onScreen(point, CAMERA)
const centreOf = (id: string) => screenOf(labelPoint(id))

function linkPath(from: string, to: string): Pt[] {
	const crossing = crossings[[from, to].sort().join('-')]
	return [
		centreOf(from),
		...(crossing ? [screenOf(project([crossing[0], crossing[1]]))] : []),
		centreOf(to),
	]
}

function lengthOf(points: readonly Pt[]): number[] {
	const lengths = [0]
	for (let i = 1; i < points.length; i++) {
		const [x0, y0] = points[i - 1]
		const [x1, y1] = points[i]
		lengths.push(lengths[i - 1] + Math.hypot(x1 - x0, y1 - y0))
	}
	return lengths
}

function pointAt(points: readonly Pt[], share: number): Pt {
	const lengths = lengthOf(points)
	const at = share * lengths[lengths.length - 1]
	const i = Math.max(
		1,
		lengths.findIndex(length => length >= at),
	)
	const span = lengths[i] - lengths[i - 1] || 1
	const t = (at - lengths[i - 1]) / span
	const [x0, y0] = points[i - 1]
	const [x1, y1] = points[i]
	return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]
}

function beadsAlong(points: readonly Pt[]): Pt[] {
	const total = lengthOf(points).at(-1) ?? 0
	const count = Math.max(2, Math.round(total / BEAD_GAP))
	return Array.from({ length: count - 1 }, (_, i) =>
		pointAt(points, (i + 1) / count),
	)
}

const toD = (points: readonly Pt[]) =>
	points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')

const LINK_SHAPES = LINKS.map(link => {
	const points = linkPath(link.from, link.to)
	return { ...link, d: toD(points), beads: beadsAlong(points) }
})
const TOUR_POINTS = CHAIN.slice(1).flatMap((id, i) =>
	linkPath(CHAIN[i], id).slice(i ? 1 : 0),
)
const TOUR_D = toD(TOUR_POINTS)

const isEnd = (id: string) => id === START || id === TARGET
const reachedAfter = (id: string) =>
	Math.min(
		...LINKS.filter(link => link.to === id).map(link => link.delay + GROW_S),
	)

export default function RoutesDemo({ active }: { active: boolean }) {
	const { t } = useTranslation()
	const locale = useCurrentLocale()
	const voiceOn = defaultSpeechLanguage(locale) !== null
	const moves = useMemo(
		() =>
			MOVES.map(move => ({
				voice: move.voice && voiceOn,
				ids: move.ids,
				typed: move.ids.map(id => demoName(id, locale)).join(', '),
			})),
		[locale, voiceOn],
	)
	const answerTicks = moves.map(move =>
		move.voice ? LISTEN_TICKS : move.typed.length + 4,
	)
	const steps = [
		INTRO_TICKS,
		...answerTicks.map(ticks => ticks + AFTER_TICKS),
		FINISH_TICKS,
	]
	const cycleTicks = steps.reduce((sum, ticks) => sum + ticks, 0)
	const { cycle, step, at, still } = useDemoTicks(
		steps,
		cycleTicks - 1,
		active,
	)

	const moveIndex = step - 1
	const current = moves[moveIndex]
	const answering = current !== undefined && at < answerTicks[moveIndex]
	const doneMoves = Math.max(0, moveIndex + (current && !answering ? 1 : 0))
	const known = new Set<string>(moves.slice(0, doneMoves).flatMap(m => m.ids))
	const latest = !still && current && !answering ? current.ids : []
	const touring = step === steps.length - 1
	const grown = (id: string) => isEnd(id) || known.has(id)
	const links = LINK_SHAPES.filter(link => grown(link.from) && grown(link.to))
	const reached = new Set<string>(links.flatMap(link => [link.from, link.to]))

	const tour = useMotionValue(still ? 1 : 0)
	useEffect(() => {
		if (still) {
			tour.set(1)
			return
		}
		tour.set(0)
		if (!touring) return
		const controls = animate(tour, 1, {
			duration: TOUR_S,
			ease: 'easeInOut',
			delay: 0.3,
		})
		return () => controls.stop()
	}, [touring, cycle, still, tour])

	const fillOf = (id: string) =>
		isEnd(id)
			? ROUTE_END_FILL
			: NEAR.has(id) && known.has(id)
				? SELECTION_FILL
				: known.has(id)
					? REVEALED_FILL
					: ROUTE_UNKNOWN_FILL
	const named = [...known]

	return (
		<DemoScreen>
			<DemoMap camera={CAMERA} fillOf={fillOf} />

			<svg
				viewBox={`0 0 ${DEMO_SIZE.width} ${DEMO_SIZE.height}`}
				className='absolute inset-0 size-full'
			>
				{links.map(link => (
					<motion.path
						key={`${cycle}:${link.from}-${link.to}`}
						d={link.d}
						fill='none'
						stroke={NAVY}
						strokeWidth={5}
						strokeLinecap='round'
						strokeLinejoin='round'
						initial={still ? false : { pathLength: 0 }}
						animate={{ pathLength: 1 }}
						transition={{ duration: GROW_S, delay: link.delay }}
					/>
				))}
				<TourTrail tour={tour} visible={touring || still} />
				{links.flatMap(link =>
					link.beads.map(([x, y], i) => (
						<motion.circle
							key={`${cycle}:${link.from}-${link.to}:${i}`}
							cx={x}
							cy={y}
							r={3.75}
							fill='white'
							stroke={NAVY}
							strokeWidth={2}
							initial={still ? false : { scale: 0 }}
							animate={{ scale: 1 }}
							transition={{
								delay:
									link.delay +
									(GROW_S * (i + 1)) / (link.beads.length + 1),
								type: 'spring',
								stiffness: 500,
								damping: 20,
							}}
						/>
					)),
				)}
				{CHAIN.filter(id => isEnd(id) || reached.has(id)).map(id => {
					const [x, y] = centreOf(id)
					const end = isEnd(id)
					return (
						<motion.circle
							key={`${cycle}:${id}`}
							cx={x}
							cy={y}
							r={end ? 8 : 6}
							fill={end ? ROUTE_END_FILL : COUNTRY_FILL}
							stroke={end ? 'white' : NAVY}
							strokeWidth={end ? 3 : 2.5}
							initial={still || end ? false : { scale: 0 }}
							animate={{ scale: 1 }}
							transition={{
								delay: end ? 0 : reachedAfter(id),
								type: 'spring',
								stiffness: 500,
								damping: 20,
							}}
						/>
					)
				})}
				<TourPuck tour={tour} visible={touring || still} />
			</svg>

			{named.map(id => {
				const [x, y] = centreOf(id)
				return (
					<span
						key={id}
						className='absolute -translate-x-1/2 -translate-y-[135%] animate-pop-in text-[13px] font-extrabold whitespace-nowrap text-ink'
						style={{ left: x, top: y, textShadow: LABEL_HALO }}
					>
						{demoName(id, locale)}
					</span>
				)
			})}
			{latest.map(id => {
				const [x, y] = centreOf(id)
				return (
					<span
						key={`${cycle}:${id}`}
						className='absolute -translate-x-1/2 -translate-y-1/2'
						style={{ left: x, top: y }}
					>
						<HitRing />
					</span>
				)
			})}

			<div className='absolute inset-x-0 top-5 mx-auto w-full max-w-md px-4'>
				<JourneyView
					start={{
						name: demoName(START, locale),
						flagUrl: '/flags/620.svg',
					}}
					target={{
						name: demoName(TARGET, locale),
						flagUrl: '/flags/616.svg',
					}}
					score={known.size}
					par={PAR}
					arrow='below'
				/>
			</div>

			<DemoField
				text={answering && !current.voice ? current.typed.slice(0, at) : ''}
				placeholder={
					answering && current.voice
						? t('voice.listening')
						: t('routes.placeholder')
				}
				listening={answering && current.voice}
				correct={false}
				trailingWidth='button'
				trailing={
					voiceOn ? (
						<MicButton
							listening={answering && current.voice}
							onPress={() => {}}
						/>
					) : null
				}
			/>
		</DemoScreen>
	)
}

function TourTrail({
	tour,
	visible,
}: {
	tour: MotionValue<number>
	visible: boolean
}) {
	return visible ? (
		<motion.path
			d={TOUR_D}
			fill='none'
			stroke={TOURED_CORD}
			strokeWidth={6}
			strokeLinecap='round'
			strokeLinejoin='round'
			style={{ pathLength: tour }}
		/>
	) : null
}

function TourPuck({
	tour,
	visible,
}: {
	tour: MotionValue<number>
	visible: boolean
}) {
	const x = useTransform(tour, share => pointAt(TOUR_POINTS, share)[0])
	const y = useTransform(tour, share => pointAt(TOUR_POINTS, share)[1])
	const shadowY = useTransform(y, value => value + 2.5)
	return visible ? (
		<g>
			<motion.circle cx={x} cy={shadowY} r={11} fill={NAVY} opacity={0.3} />
			<motion.circle
				cx={x}
				cy={y}
				r={10}
				fill='white'
				stroke={TOURED_RIM}
				strokeWidth={5}
			/>
		</g>
	) : null
}
