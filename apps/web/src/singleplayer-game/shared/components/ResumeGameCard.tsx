import type { GameDifficulty, GameScope } from '@georally/game-domain'
import { Play } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getDifficultyLabel, getScopeLabel } from '@/shared/i18n'
import { Button, Card } from '@/shared/ui'
import { cn } from '@/shared/utils'

interface ResumeGameCardProps {
	current: number
	answered: number
	total: number
	scope: GameScope
	difficulty: GameDifficulty
	onResume: () => void
	onDiscard: () => void
}

interface CardTheme {
	card: string
	eyebrow: string
	details: string
	track: string
	fill: string
	discard?: string
}

const LIGHT_DETAILS = 'text-ink/70'
const DARK_DETAILS = 'text-white/85'
const DARK_DISCARD = 'text-white hover:bg-white/12'
const YELLOW_FILL =
	'bg-sunflower-300 shadow-[inset_0_-3px_0_0_var(--color-sunflower-600)]'

const THEMES: readonly CardTheme[] = [
	{
		card: 'border-ocean-200 bg-ocean-100 [--edge:var(--color-ocean-300)]',
		eyebrow: 'text-ocean-700',
		details: LIGHT_DETAILS,
		track: 'bg-ocean-50 shadow-[inset_0_2px_0_0_var(--color-ocean-200)]',
		fill: 'bg-ocean-500 shadow-[inset_0_-3px_0_0_var(--color-ocean-600)]',
	},
	{
		card: 'border-grape-200 bg-grape-100 [--edge:var(--color-grape-300)]',
		eyebrow: 'text-grape-700',
		details: LIGHT_DETAILS,
		track: 'bg-grape-50 shadow-[inset_0_2px_0_0_var(--color-grape-200)]',
		fill: 'bg-grape-500 shadow-[inset_0_-3px_0_0_var(--color-grape-600)]',
	},
	{
		card: 'border-coral-200 bg-coral-100 [--edge:var(--color-coral-300)]',
		eyebrow: 'text-coral-700',
		details: LIGHT_DETAILS,
		track: 'bg-coral-50 shadow-[inset_0_2px_0_0_var(--color-coral-200)]',
		fill: 'bg-coral-500 shadow-[inset_0_-3px_0_0_var(--color-coral-600)]',
	},
	{
		card: 'border-grape-600 bg-grape-500 text-white [--edge:var(--color-grape-800)]',
		eyebrow: 'text-sunflower-200',
		details: 'text-white/80',
		track: 'bg-grape-600 shadow-[inset_0_2px_0_0_var(--color-grape-700)]',
		fill: YELLOW_FILL,
		discard: DARK_DISCARD,
	},
	{
		card: 'border-sunflower-200 bg-sunflower-50 [--edge:var(--color-sunflower-300)]',
		eyebrow: 'text-sunflower-700',
		details: LIGHT_DETAILS,
		track: 'bg-white shadow-[inset_0_2px_0_0_var(--color-sunflower-200)]',
		fill: 'bg-sunflower-500 shadow-[inset_0_-3px_0_0_var(--color-sunflower-600)]',
	},
	{
		card: 'border-line-strong bg-paper-deep [--edge:#a3b4cb]',
		eyebrow: 'text-ocean-600',
		details: LIGHT_DETAILS,
		track: 'bg-paper shadow-[inset_0_2px_0_0_var(--color-line-strong)]',
		fill: 'bg-ocean-500 shadow-[inset_0_-3px_0_0_var(--color-ocean-600)]',
	},
	{
		card: 'border-coral-600 bg-coral-500 text-white [--edge:var(--color-coral-800)]',
		eyebrow: 'text-sunflower-200',
		details: DARK_DETAILS,
		track: 'bg-coral-600 shadow-[inset_0_2px_0_0_var(--color-coral-700)]',
		fill: YELLOW_FILL,
		discard: DARK_DISCARD,
	},
	{
		card: 'border-[#c4cdfb] bg-[linear-gradient(135deg,var(--color-ocean-100),var(--color-grape-100))] [--edge:#a9a7f4]',
		eyebrow: 'text-grape-700',
		details: LIGHT_DETAILS,
		track: 'bg-grape-50 shadow-[inset_0_2px_0_0_#c4cdfb]',
		fill: 'bg-grape-500 shadow-[inset_0_-3px_0_0_var(--color-grape-600)]',
	},
	{
		card: 'border-[#ffc6b4] bg-[linear-gradient(135deg,var(--color-coral-100),var(--color-sunflower-50))] [--edge:#ffa58f]',
		eyebrow: 'text-coral-700',
		details: LIGHT_DETAILS,
		track: 'bg-white shadow-[inset_0_2px_0_0_#ffc6b4]',
		fill: 'bg-coral-400 shadow-[inset_0_-3px_0_0_var(--color-coral-600)]',
	},
	{
		card: 'border-[#0e1529] bg-ink text-white [--edge:#070b17]',
		eyebrow: 'text-sunflower-300',
		details: 'text-white/75',
		track: 'bg-[#2a3558] shadow-[inset_0_2px_0_0_#0e1529]',
		fill: YELLOW_FILL,
		discard: 'text-white hover:bg-white/10',
	},
	{
		card: 'border-grape-600 bg-[linear-gradient(135deg,var(--color-grape-500),var(--color-ocean-500))] text-white [--edge:var(--color-grape-800)]',
		eyebrow: 'text-sunflower-200',
		details: DARK_DETAILS,
		track: 'bg-ink/25 shadow-[inset_0_2px_0_0_rgb(24_34_61/0.3)]',
		fill: YELLOW_FILL,
		discard: DARK_DISCARD,
	},
	{
		card: 'border-[#a9dfc4] bg-[linear-gradient(135deg,var(--color-grass-100),var(--color-ocean-100))] [--edge:#7cc7a8]',
		eyebrow: 'text-grass-800',
		details: LIGHT_DETAILS,
		track: 'bg-grass-50 shadow-[inset_0_2px_0_0_#a9dfc4]',
		fill: 'bg-grass-500 shadow-[inset_0_-3px_0_0_var(--color-grass-600)]',
	},
]

function pickTheme(): CardTheme {
	return THEMES[Math.floor(Math.random() * THEMES.length)]
}

export function ResumeGameCard({
	current,
	answered,
	total,
	scope,
	difficulty,
	onResume,
	onDiscard,
}: ResumeGameCardProps) {
	const { t } = useTranslation()
	const reduceMotion = useReducedMotion()
	const [theme] = useState(pickTheme)

	return (
		<Card className={theme.card}>
			<h1
				className={cn(
					'text-sm font-extrabold tracking-wide uppercase',
					theme.eyebrow,
				)}
			>
				{t('singleplayer.resume.title')}
			</h1>
			<p className='mt-2 text-3xl font-black tracking-tight sm:text-4xl'>
				{t('game.progress', { current, total })}
			</p>
			<p className={cn('mt-1 font-bold', theme.details)}>
				{getScopeLabel(t, scope)} · {getDifficultyLabel(t, difficulty)}
			</p>

			<div
				role='progressbar'
				aria-valuemin={0}
				aria-valuemax={total}
				aria-valuenow={answered}
				className={cn('mt-6 h-5 rounded-full p-1', theme.track)}
			>
				<motion.div
					className={cn('h-full rounded-full', theme.fill)}
					initial={reduceMotion ? false : { width: 0 }}
					animate={{ width: `${(answered / total) * 100}%` }}
					transition={{
						type: 'spring',
						stiffness: 120,
						damping: 18,
						delay: 0.15,
					}}
				/>
			</div>

			<div className='mt-7 flex items-center justify-between gap-3'>
				<Button
					type='button'
					size='sm'
					variant='ghost'
					className={theme.discard}
					onClick={onDiscard}
				>
					{t('singleplayer.resume.discard')}
				</Button>
				<Button type='button' size='sm' autoFocus onClick={onResume}>
					<Play aria-hidden='true' fill='currentColor' />
					{t('singleplayer.resume.resume')}
				</Button>
			</div>
		</Card>
	)
}
