import { geoCentroid, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { MapPin } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { feature } from 'topojson-client'
import type { GeometryCollection } from 'topojson-specification'
import world from 'world-atlas/countries-110m.json'
import { useCurrentLocale } from '@/app/LocaleContext'

/** `id` matches world-atlas features; `code` feeds Intl.DisplayNames. */
const TARGETS = [
	{ id: '392', code: 'JP', points: 95 },
	{ id: '076', code: 'BR', points: 80 },
	{ id: '818', code: 'EG', points: 100 },
	{ id: '036', code: 'AU', points: 90 },
	{ id: '356', code: 'IN', points: 85 },
	{ id: '484', code: 'MX', points: 95 },
	{ id: '710', code: 'ZA', points: 75 },
	{ id: '380', code: 'IT', points: 100 },
	{ id: '398', code: 'KZ', points: 90 },
	{ id: '032', code: 'AR', points: 85 },
] as const

const SPIN_MS = 1300
const HOLD_MS = 2700
const CYCLE_MS = SPIN_MS + HOLD_MS

const COLORS = {
	oceanLight: '#6dbbff',
	ocean: '#1b7ff0',
	oceanDeep: '#0f50a8',
	land: '#82d95c',
	landEdge: '#ffffff',
	target: '#ffc01a',
	targetEdge: '#a86200',
}

type Rotation = [number, number]

const countries = feature(
	world,
	world.objects.countries as GeometryCollection,
) as FeatureCollection<Geometry, { name: string }>

function easeInOutCubic(t: number): number {
	return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function lerpAngle(from: number, to: number, t: number): number {
	const delta = ((((to - from) % 360) + 540) % 360) - 180
	return from + delta * t
}

function rotationFor(target: Feature): Rotation {
	const [lon, lat] = geoCentroid(target)
	return [-lon, -lat]
}

function useCountryName(code: string): string {
	const locale = useCurrentLocale()
	return useMemo(() => {
		try {
			const names = new Intl.DisplayNames([locale.split('-')[0], 'en'], {
				type: 'region',
			})
			return names.of(code) ?? code
		} catch {
			return code
		}
	}, [locale, code])
}

function QuestionCard({ index }: { index: number }) {
	const target = TARGETS[index]
	const name = useCountryName(target.code)

	return (
		<div className='raised absolute top-0 left-1/2 z-10 w-56 -translate-x-1/2 overflow-hidden rounded-[18px] border-2 border-line bg-white px-4 pt-2.5 pb-3 text-center [--edge-size:5px]'>
			<p className='text-xs font-extrabold text-muted tabular-nums'>
				{(index % 10) + 1}/10
			</p>
			<AnimatePresence mode='popLayout' initial={false}>
				<motion.p
					key={index}
					className='truncate text-2xl font-black tracking-tight'
					initial={{ y: 18, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: -18, opacity: 0 }}
					transition={{ duration: 0.25, ease: 'easeOut' }}
				>
					{name}
				</motion.p>
			</AnimatePresence>
			<motion.span
				key={`timer-${index}`}
				className='absolute bottom-0 left-0 h-1 bg-grape-400'
				initial={{ width: '100%' }}
				animate={{ width: '0%' }}
				transition={{ duration: CYCLE_MS / 1000, ease: 'linear' }}
			/>
		</div>
	)
}

export default function HeroGlobe() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const reduceMotion = useReducedMotion()
	const [index, setIndex] = useState(0)

	const targetFeatures = useMemo(
		() =>
			TARGETS.map(
				target =>
					countries.features.find(country => country.id === target.id) ??
					countries.features[0],
			),
		[],
	)

	useEffect(() => {
		const canvas = canvasRef.current
		const context = canvas?.getContext('2d')
		if (!canvas || !context) return

		const projection = geoOrthographic().clipAngle(90).precision(0.5)
		const path = geoPath(projection, context)
		const graticule = geoGraticule10()
		let size = 0
		let frame = 0
		let current: Rotation = rotationFor(targetFeatures[0])
		let from: Rotation = current
		let to: Rotation = current
		let cycleStart = performance.now() - SPIN_MS
		let targetIndex = 0
		let highlight = 1

		function resize() {
			const ratio = window.devicePixelRatio || 1
			size = canvas!.clientWidth
			canvas!.width = size * ratio
			canvas!.height = size * ratio
			context!.setTransform(ratio, 0, 0, ratio, 0, 0)
			projection.translate([size / 2, size / 2]).scale(size / 2 - 3)
		}

		function draw() {
			const radius = size / 2 - 3
			const center = size / 2
			projection.rotate(current)
			context!.clearRect(0, 0, size, size)

			const ocean = context!.createRadialGradient(
				center * 0.7,
				center * 0.6,
				radius * 0.1,
				center,
				center,
				radius,
			)
			ocean.addColorStop(0, COLORS.oceanLight)
			ocean.addColorStop(1, COLORS.ocean)
			context!.beginPath()
			path({ type: 'Sphere' })
			context!.fillStyle = ocean
			context!.fill()

			context!.beginPath()
			path(graticule)
			context!.strokeStyle = 'rgba(255,255,255,0.16)'
			context!.lineWidth = 1
			context!.stroke()

			context!.beginPath()
			path(countries)
			context!.fillStyle = COLORS.land
			context!.fill()
			context!.strokeStyle = COLORS.landEdge
			context!.lineWidth = 0.8
			context!.stroke()

			if (highlight > 0) {
				context!.globalAlpha = highlight
				context!.beginPath()
				path(targetFeatures[targetIndex])
				context!.fillStyle = COLORS.target
				context!.fill()
				context!.strokeStyle = COLORS.targetEdge
				context!.lineWidth = 1.5
				context!.stroke()
				context!.globalAlpha = 1
			}

			const shade = context!.createRadialGradient(
				center * 0.65,
				center * 0.55,
				radius * 0.2,
				center,
				center,
				radius,
			)
			shade.addColorStop(0, 'rgba(255,255,255,0.18)')
			shade.addColorStop(0.7, 'rgba(255,255,255,0)')
			shade.addColorStop(1, 'rgba(16,47,92,0.28)')
			context!.beginPath()
			path({ type: 'Sphere' })
			context!.fillStyle = shade
			context!.fill()
			context!.strokeStyle = COLORS.oceanDeep
			context!.lineWidth = 3
			context!.stroke()
		}

		function tick(now: number) {
			const elapsed = now - cycleStart

			if (elapsed >= CYCLE_MS) {
				targetIndex = (targetIndex + 1) % TARGETS.length
				setIndex(targetIndex)
				from = current
				to = rotationFor(targetFeatures[targetIndex])
				cycleStart = now
				highlight = 0
			} else if (elapsed < SPIN_MS) {
				const t = reduceMotion ? 1 : easeInOutCubic(elapsed / SPIN_MS)
				current = [
					lerpAngle(from[0], to[0], t),
					from[1] + (to[1] - from[1]) * t,
				]
				highlight = 0
			} else {
				current = to
				highlight = Math.min(1, (elapsed - SPIN_MS) / 300)
			}

			draw()
			frame = requestAnimationFrame(tick)
		}

		const observer = new ResizeObserver(() => {
			resize()
			draw()
		})
		observer.observe(canvas)
		resize()
		frame = requestAnimationFrame(tick)

		return () => {
			cancelAnimationFrame(frame)
			observer.disconnect()
		}
	}, [reduceMotion, targetFeatures])

	const target = TARGETS[index]

	return (
		<div
			aria-hidden='true'
			className='relative mx-auto w-full max-w-[440px] pt-16 select-none'
		>
			<QuestionCard index={index} />

			<div className='relative'>
				<canvas ref={canvasRef} className='block aspect-square w-full' />

				<AnimatePresence>
					<motion.div
						key={index}
						className='pointer-events-none absolute top-1/2 left-1/2'
						exit={{ opacity: 0, transition: { duration: 0.2 } }}
					>
						<motion.span
							className='absolute -top-3 -left-6 block size-12 rounded-full border-4 border-sunflower-300'
							initial={{ scale: 0, opacity: 0 }}
							animate={{ scale: [0, 1.6, 2.2], opacity: [0, 0.9, 0] }}
							transition={{
								duration: 1.1,
								delay: SPIN_MS / 1000 + 0.15,
								ease: 'easeOut',
							}}
						/>
						<motion.span
							className='absolute -top-14 -left-7 block'
							initial={{ y: -60, opacity: 0, scale: 0.6 }}
							animate={{ y: 0, opacity: 1, scale: 1 }}
							transition={{
								delay: SPIN_MS / 1000,
								type: 'spring',
								stiffness: 520,
								damping: 15,
							}}
						>
							<MapPin
								className='size-14 fill-coral-500 text-white drop-shadow-[0_5px_0_var(--color-coral-800)]'
								strokeWidth={2}
							/>
						</motion.span>
						<motion.span
							className='absolute -top-20 left-6 text-3xl font-black text-sunflower-300 tabular-nums'
							style={{
								textShadow:
									'-2px -2px 0 #18223d, 2px -2px 0 #18223d, -2px 2px 0 #18223d, 2px 2px 0 #18223d, 0 5px 0 #18223d',
							}}
							initial={{ y: 10, opacity: 0, scale: 0.5 }}
							animate={{
								y: [10, -6, -22],
								opacity: [0, 1, 0],
								scale: [0.5, 1.1, 1],
							}}
							transition={{
								delay: SPIN_MS / 1000 + 0.35,
								duration: 1.6,
								times: [0, 0.3, 1],
							}}
						>
							+{target.points}
						</motion.span>
					</motion.div>
				</AnimatePresence>
			</div>

			<div className='mx-auto mt-3 h-4 w-3/5 rounded-[50%] bg-ink/12 blur-[2px]' />
		</div>
	)
}
