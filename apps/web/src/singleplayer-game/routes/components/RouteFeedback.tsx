import {
	getLastMove,
	type Attempt,
	type PlayingRouteState,
	type RouteBoard,
} from '@georally/game-domain/singleplayer/routes'
import { Lightbulb } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils'
import { useCountryName } from '../countryNames'
import { VERDICT_PILL } from './verdictStyle'

const OFFSET_Y = 14
const SHOWN = { opacity: 1, y: 0, scale: 1 }

type Feedback =
	| { key: number; kind: 'named'; ids: readonly string[]; hinted: boolean }
	| { key: number; kind: 'mistake'; attempt: Attempt }

function latestFeedback(
	state: PlayingRouteState,
	mistake: Attempt | null,
): Feedback | null {
	const move = getLastMove(state)
	if (move && move.countryIds.length > 0) {
		return {
			key: move.at,
			kind: 'named',
			ids: move.countryIds,
			hinted: move.kind === 'hint',
		}
	}
	return mistake
		? { key: mistake.at, kind: 'mistake', attempt: mistake }
		: null
}

interface RouteFeedbackProps {
	state: PlayingRouteState
	board: RouteBoard
	mistake: Attempt | null
	enterFrom: 'above' | 'below'
}

export function RouteFeedback({
	state,
	board,
	mistake,
	enterFrom,
}: RouteFeedbackProps) {
	const reduceMotion = useReducedMotion()
	const feedback = latestFeedback(state, mistake)
	const hidden = reduceMotion
		? { opacity: 0 }
		: {
				opacity: 0,
				y: enterFrom === 'below' ? OFFSET_Y : -OFFSET_Y,
				scale: 0.96,
			}

	return (
		<AnimatePresence mode='wait' initial={false}>
			{feedback ? (
				<motion.div
					key={feedback.key}
					className='mx-auto w-fit max-w-full'
					initial={hidden}
					animate={SHOWN}
					exit={hidden}
					transition={{ duration: 0.22, ease: [0.2, 0.9, 0.3, 1.3] }}
				>
					{feedback.kind === 'named' ? (
						<Named
							board={board}
							ids={feedback.ids}
							hinted={feedback.hinted}
						/>
					) : (
						<MistakeNote
							attempt={feedback.attempt}
							startId={board.startId}
						/>
					)}
				</motion.div>
			) : null}
		</AnimatePresence>
	)
}

const PILL =
	'inline-flex items-center gap-1.5 truncate rounded-full px-4 py-1.5 text-sm font-extrabold sm:text-base'

function Named({
	board,
	ids,
	hinted,
}: {
	board: RouteBoard
	ids: readonly string[]
	hinted: boolean
}) {
	const countryName = useCountryName()

	return (
		<div aria-hidden='true' className='flex flex-wrap justify-center gap-1.5'>
			{ids.map(countryId => (
				<p
					key={countryId}
					className={cn(PILL, VERDICT_PILL[board.verdict(countryId)])}
				>
					{hinted ? (
						<Lightbulb className='size-4 shrink-0' strokeWidth={2.75} />
					) : null}
					{countryName(countryId)}
				</p>
			))}
		</div>
	)
}

function MistakeNote({
	attempt,
	startId,
}: {
	attempt: Attempt
	startId: string
}) {
	const { t } = useTranslation()
	const countryName = useCountryName()
	const [repeated] = attempt.repeatedIds
	const [endpoint] = attempt.endpointIds
	const [unresolved] = attempt.unresolved

	const message = repeated
		? t('routes.note.repeated', { name: countryName(repeated) })
		: endpoint
			? t(
					endpoint === startId
						? 'routes.note.start'
						: 'routes.note.target',
					{
						name: countryName(endpoint),
					},
				)
			: unresolved?.kind === 'ambiguous'
				? t('routes.note.ambiguous', { text: unresolved.heard })
				: t('routes.note.unknown', { text: attempt.heard })

	return (
		<p role='status' className={cn(PILL, VERDICT_PILL.off)}>
			{message}
		</p>
	)
}
