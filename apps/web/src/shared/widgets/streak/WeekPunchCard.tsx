import { motion, useReducedMotion } from 'motion/react'
import { useId, type ReactNode } from 'react'
import { cn } from '@/shared/utils'

export type PunchStatus =
	'perfect' | 'solved' | 'missed' | 'open' | 'future' | 'none'

export interface PunchSlot {
	day: string
	label: string
	status: PunchStatus
}

const CARD_HEIGHT = 84
const EDGE = 4
const HOLE_Y = 60
const RADIUS = 11
const PUNCH_MS = 0.12

const STAR = (() => {
	const points = Array.from({ length: 10 }, (_, i) => {
		const angle = (Math.PI / 5) * i - Math.PI / 2
		const r = i % 2 ? 6 : 13
		return `${(Math.cos(angle) * r).toFixed(2)} ${(Math.sin(angle) * r).toFixed(2)}`
	})
	return `M${points.join('L')}Z`
})()

const punched = (status: PunchStatus) =>
	status === 'solved' || status === 'perfect'
const center = (index: number, count: number) =>
	`${((index + 0.5) / count) * 100}%`

function HoleShape({ status }: { status: PunchStatus }) {
	return status === 'perfect' ? (
		<path d={STAR} strokeWidth='3' strokeLinejoin='round' />
	) : (
		<circle r={RADIUS} />
	)
}

export function WeekPunchCard({
	slots,
	title,
	aside,
	punch = null,
	className,
}: {
	slots: readonly PunchSlot[]
	title: ReactNode
	aside?: ReactNode
	punch?: { index: number; delay: number } | null
	className?: string
}) {
	const reduceMotion = useReducedMotion()
	const id = useId().replace(/[^a-zA-Z0-9]/g, '')
	const punchAt = reduceMotion ? null : punch
	const punchedSlot = punchAt ? slots[punchAt.index] : null

	const holes = (offset: number) =>
		slots.map((slot, i) =>
			punched(slot.status) ? (
				<svg
					key={slot.day}
					x={center(i, slots.length)}
					y={HOLE_Y + offset}
					overflow='visible'
				>
					<motion.g
						fill='#000'
						stroke='#000'
						initial={punchAt?.index === i ? { scale: 0 } : false}
						animate={{ scale: 1 }}
						transition={{
							duration: PUNCH_MS,
							ease: 'easeOut',
							delay: punchAt?.delay ?? 0,
						}}
					>
						<HoleShape status={slot.status} />
					</motion.g>
				</svg>
			) : null,
		)

	return (
		<div
			className={cn(
				'relative [filter:drop-shadow(0_8px_10px_rgb(24_34_61/0.14))]',
				className,
			)}
			style={{ height: CARD_HEIGHT }}
		>
			<motion.div
				className='absolute inset-0'
				initial={false}
				animate={
					punchAt
						? {
								transform: [
									'translateY(0px) rotate(0deg)',
									'translateY(3px) rotate(-1deg)',
									'translateY(-1px) rotate(0.4deg)',
									'translateY(0px) rotate(0deg)',
								],
							}
						: undefined
				}
				transition={{
					delay: punchAt?.delay,
					duration: 0.45,
					times: [0, 0.25, 0.6, 1],
				}}
			>
				<svg
					aria-hidden='true'
					className='absolute inset-0 size-full overflow-visible'
				>
					<defs>
						<mask
							id={`${id}face`}
							maskUnits='userSpaceOnUse'
							x='0'
							y='0'
							width='100%'
							height='100%'
						>
							<rect width='100%' height='100%' fill='#fff' />
							{holes(0)}
						</mask>
						<mask
							id={`${id}edge`}
							maskUnits='userSpaceOnUse'
							x='0'
							y='0'
							width='100%'
							height='100%'
						>
							<rect width='100%' height='100%' fill='#fff' />
							{holes(EDGE)}
						</mask>
					</defs>
					<rect
						y={EDGE}
						width='100%'
						height={CARD_HEIGHT - EDGE}
						rx='16'
						className='fill-sunflower-300'
						mask={`url(#${id}edge)`}
					/>
					<rect
						width='100%'
						height={CARD_HEIGHT - EDGE}
						rx='16'
						className='fill-sunflower-50'
						mask={`url(#${id}face)`}
					/>
					{slots.map((slot, i) => (
						<svg
							key={slot.day}
							x={center(i, slots.length)}
							y={HOLE_Y}
							overflow='visible'
						>
							<PrintedMark
								status={slot.status}
								punchDelay={punchAt?.index === i ? punchAt.delay : null}
							/>
						</svg>
					))}
				</svg>
				<div className='relative flex h-full flex-col'>
					<div className='flex items-baseline justify-between gap-2 px-3.5 pt-2'>
						<p className='truncate text-xs font-black tracking-wide text-ink uppercase'>
							{title}
						</p>
						{aside}
					</div>
					<div className='mt-1 flex'>
						{slots.map(slot => (
							<span
								key={slot.day}
								className={cn(
									'flex-1 text-center text-[0.6875rem] font-extrabold',
									slot.status === 'open'
										? 'text-coral-600'
										: 'text-ink/45',
								)}
							>
								{slot.label}
							</span>
						))}
					</div>
				</div>
			</motion.div>
			{punchAt && punchedSlot ? (
				<Chad
					left={center(punchAt.index, slots.length)}
					status={punchedSlot.status}
					delay={punchAt.delay}
				/>
			) : null}
		</div>
	)
}

function PrintedMark({
	status,
	punchDelay,
}: {
	status: PunchStatus
	punchDelay: number | null
}) {
	if (punchDelay !== null) {
		return (
			<motion.circle
				r={RADIUS}
				className='fill-none stroke-ink/40'
				strokeWidth='2.5'
				strokeDasharray='4 3.5'
				initial={{ opacity: 1 }}
				animate={{ opacity: 0 }}
				transition={{ delay: punchDelay, duration: 0.05 }}
			/>
		)
	}
	switch (status) {
		case 'missed':
			return (
				<g
					className='stroke-coral-500'
					strokeWidth='4'
					strokeLinecap='round'
					transform='rotate(-8)'
				>
					<line x1='-7' y1='-7' x2='7' y2='7' />
					<line x1='7' y1='-7' x2='-7' y2='7' />
				</g>
			)
		case 'open':
			return <OpenMark />
		case 'future':
			return (
				<circle
					r={RADIUS}
					className='fill-none stroke-ink/12'
					strokeWidth='2'
				/>
			)
		case 'none':
			return <circle r='2' className='fill-ink/12' />
		default:
			return null
	}
}

function OpenMark() {
	const reduceMotion = useReducedMotion()
	return (
		<motion.circle
			r={RADIUS}
			className='fill-sunflower-100 stroke-coral-500'
			strokeWidth='2.5'
			strokeDasharray='4 3.5'
			animate={reduceMotion ? undefined : { rotate: [0, 90] }}
			transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
		/>
	)
}

function Chad({
	left,
	status,
	delay,
}: {
	left: string
	status: PunchStatus
	delay: number
}) {
	return (
		<motion.svg
			aria-hidden='true'
			viewBox='-15 -15 30 34'
			className='pointer-events-none absolute size-[1.9rem] overflow-visible'
			style={{ left, top: HOLE_Y, marginLeft: -15, marginTop: -15 }}
			initial={{ opacity: 0 }}
			animate={{
				opacity: [0, 1, 1, 0],
				transform: [
					'translate(0px, 0px) rotate(0deg)',
					'translate(2px, 6px) rotate(20deg)',
					'translate(10px, 70px) rotate(150deg)',
					'translate(16px, 150px) rotate(260deg)',
				],
			}}
			transition={{
				delay,
				duration: 0.9,
				times: [0, 0.12, 0.6, 1],
				ease: ['easeOut', 'easeIn', 'linear'],
			}}
		>
			<g
				transform='translate(0 3)'
				className='fill-sunflower-300 stroke-sunflower-300'
			>
				<HoleShape status={status} />
			</g>
			<g className='fill-sunflower-50 stroke-sunflower-50'>
				<HoleShape status={status} />
			</g>
		</motion.svg>
	)
}
