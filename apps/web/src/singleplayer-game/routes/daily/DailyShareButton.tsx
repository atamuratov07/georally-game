import type {
	FinishedRouteState,
	RouteBoard,
} from '@georally/game-domain/singleplayer/routes'
import { Lightbulb } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { trackRoutesShare } from '@/shared/analytics/track'
import { shareOrCopy } from '@/shared/lib/clipboard'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/utils'
import {
	SHOWN_TILES,
	shareMoves,
	shareText,
	TILE_STEP,
	type ShareMark,
	type ShareMove,
} from './share'

const COPIED_MS = 1800

const TILE_STYLE: Readonly<Record<ShareMark, string>> = {
	route: 'bg-grass-500 [--edge:var(--color-grass-700)]',
	near: 'bg-sunflower-400 [--edge:var(--color-sunflower-600)]',
	off: 'bg-coral-500 [--edge:var(--color-coral-700)]',
	hint: 'border-2 border-dashed border-ink/35 bg-white text-ink/70 [--edge:var(--color-line-strong)]',
}

interface DailyShareButtonProps {
	number: number
	board: RouteBoard | null
	state: FinishedRouteState
	delay?: number
	className?: string
}

export function DailyShareButton({
	number,
	board,
	state,
	delay = 0,
	className,
}: DailyShareButtonProps) {
	const { t } = useTranslation()
	const moves = useMemo(
		() => (board ? shareMoves(board, state) : []),
		[board, state],
	)
	const reduceMotion = useReducedMotion()
	const [shuffles, setShuffles] = useState(0)
	const [copied, setCopied] = useState(false)

	useEffect(() => {
		if (!copied) return
		const timer = setTimeout(() => setCopied(false), COPIED_MS)
		return () => clearTimeout(timer)
	}, [copied, shuffles])

	async function share() {
		if (!board) return
		setShuffles(count => count + 1)
		const result = await shareOrCopy(shareText(number, board, state))
		if (result === 'copied') setCopied(true)
		if (result === 'failed') toast.error(t('daily.shareFailed'))
		if (result === 'shared' || result === 'copied') {
			trackRoutesShare({
				dailyNumber: number,
				outcome: state.outcome === 'solved' ? 'solved' : 'gave_up',
				method: result === 'shared' ? 'share' : 'copy',
			})
		}
	}

	return (
		<Button
			type='button'
			size='lg'
			variant='neutral'
			className={cn('w-full gap-3', className)}
			disabled={!board}
			onClick={() => void share()}
		>
			<ShareTiles
				key={shuffles}
				moves={moves}
				delay={shuffles === 0 ? delay : 0}
			/>
			<span className='relative inline-grid'>
				<AnimatePresence initial={false} mode='popLayout'>
					<motion.span
						key={copied ? 'copied' : 'share'}
						initial={reduceMotion ? false : { y: 14, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={reduceMotion ? undefined : { y: -14, opacity: 0 }}
						transition={{ type: 'spring', stiffness: 600, damping: 30 }}
					>
						{t(copied ? 'daily.copied' : 'daily.share')}
					</motion.span>
				</AnimatePresence>
			</span>
		</Button>
	)
}

function ShareTiles({
	moves,
	delay,
}: {
	moves: readonly ShareMove[]
	delay: number
}) {
	const reduceMotion = useReducedMotion()
	const shown = moves.slice(0, SHOWN_TILES)
	const hidden = moves.length - shown.length
	const size = moves.length > 10 ? 'size-4 rounded-[4px]' : 'size-5 rounded-md'

	return (
		<span aria-hidden='true' className='flex items-center gap-1'>
			{shown.map((move, i) => (
				<motion.span
					key={i}
					className={cn(
						'raised grid place-items-center [--edge-size:3px]',
						size,
						TILE_STYLE[move.mark],
					)}
					initial={reduceMotion ? false : { rotateX: 90, y: -6 }}
					animate={{ rotateX: 0, y: 0 }}
					transition={{
						type: 'spring',
						stiffness: 520,
						damping: 22,
						delay: delay + i * TILE_STEP,
					}}
				>
					{move.mark === 'hint' ? (
						<Lightbulb className='size-3! stroke-[3]!' />
					) : null}
				</motion.span>
			))}
			{hidden > 0 ? (
				<span className='text-sm font-black text-muted'>+{hidden}</span>
			) : null}
		</span>
	)
}
