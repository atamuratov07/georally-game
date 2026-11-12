import type { FeedbackReaction } from '@georally/game-protocol'
import { AnimatePresence, motion, type TargetAndTransition } from 'motion/react'
import { useId, useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import {
	trackGameReaction,
	type ReactionModeParam,
} from '@/shared/analytics/track'
import { TextButton } from '@/shared/ui'
import { cn } from '@/shared/utils'
import { BouncingPin, MissedPin, StandingPin } from './ReactionFaces'
import { useFeedback } from './useFeedback'
import { useReactionPrompt } from './useReactionPrompt'

const SPRING = { type: 'spring', stiffness: 460, damping: 15 } as const

const REACTIONS: readonly {
	value: FeedbackReaction
	Face: ComponentType<{ className?: string }>
	ring: string
	hover: TargetAndTransition
}[] = [
	{
		value: 'negative',
		Face: MissedPin,
		ring: 'border-coral-400',
		hover: {
			rotate: [0, -10, 9, -6, 3, 0],
			transition: { duration: 0.55, ease: 'easeInOut' },
		},
	},
	{
		value: 'neutral',
		Face: StandingPin,
		ring: 'border-sunflower-400',
		hover: { rotate: -12, y: -2, transition: SPRING },
	},
	{
		value: 'positive',
		Face: BouncingPin,
		ring: 'border-grass-400',
		hover: {
			y: [0, -9, 0, -4, 0],
			scale: [1, 1.1, 1, 1.05, 1],
			transition: { duration: 0.6, ease: 'easeOut' },
		},
	},
]

export function GameReaction({
	mode,
	className,
}: {
	mode: ReactionModeParam
	className?: string
}) {
	const show = useReactionPrompt(mode)

	return show ? (
		<ReactionPicker mode={mode} className={className} entranceDelay={0.7} />
	) : null
}

export interface ReactionPickerProps {
	mode: ReactionModeParam
	className?: string
	entranceDelay?: number
	onReact?: () => void
	onTellMore?: () => void
}

export function ReactionPicker({
	mode,
	className,
	entranceDelay = 0,
	onReact,
	onTellMore,
}: ReactionPickerProps) {
	const { t } = useTranslation()
	const openFeedback = useFeedback()
	const labelId = useId()
	const [reaction, setReaction] = useState<FeedbackReaction | null>(null)

	const choose = (value: FeedbackReaction) => {
		setReaction(value)
		trackGameReaction({ mode, reaction: value })
		onReact?.()
	}

	return (
		<div className={cn('flex flex-col items-center gap-2', className)}>
			<p id={labelId} className='text-sm font-extrabold text-muted'>
				{reaction ? t('reaction.thanks') : t('reaction.prompt')}
			</p>
			<div
				role='group'
				aria-labelledby={labelId}
				className='flex items-end gap-3'
			>
				{REACTIONS.map(({ value, Face, ring, hover }, index) => {
					const selected = reaction === value
					const state =
						reaction === null ? 'idle' : selected ? 'selected' : 'dimmed'

					return (
						<motion.button
							key={value}
							type='button'
							aria-label={t(`reaction.${value}`)}
							aria-pressed={selected}
							disabled={reaction !== null}
							onClick={() => choose(value)}
							className='relative rounded-full p-0.5 disabled:cursor-default'
							initial={{ opacity: 0, scale: 0.3, y: 10 }}
							animate={state}
							variants={{
								idle: {
									opacity: 1,
									scale: 1,
									y: 0,
									filter: 'grayscale(0)',
									transition: {
										...SPRING,
										delay: entranceDelay + index * 0.09,
									},
								},
								selected: {
									opacity: 1,
									scale: [1, 1.32, 1.14],
									y: 0,
									rotate: 0,
									transition: { duration: 0.45, ease: 'easeOut' },
								},
								dimmed: {
									opacity: 0.4,
									scale: 0.82,
									y: 0,
									rotate: 0,
									filter: 'grayscale(1)',
									transition: SPRING,
								},
							}}
							whileHover={reaction === null ? hover : undefined}
							whileTap={reaction === null ? { scale: 0.88 } : undefined}
						>
							{selected ? (
								<motion.span
									aria-hidden='true'
									className={cn(
										'pointer-events-none absolute inset-0 rounded-full border-4',
										ring,
									)}
									initial={{ scale: 0.6, opacity: 0.9 }}
									animate={{ scale: 1.75, opacity: 0 }}
									transition={{ duration: 0.6, ease: 'easeOut' }}
								/>
							) : null}
							<Face className='size-16' />
						</motion.button>
					)
				})}
			</div>
			<AnimatePresence>
				{reaction ? (
					<motion.div
						initial={{ opacity: 0, y: -6, scale: 0.9 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						transition={{ ...SPRING, delay: 0.25 }}
					>
						<TextButton
							type='button'
							onClick={() => {
								openFeedback({ reaction })
								onTellMore?.()
							}}
						>
							{t('reaction.tellMore')}
						</TextButton>
					</motion.div>
				) : null}
			</AnimatePresence>
		</div>
	)
}
