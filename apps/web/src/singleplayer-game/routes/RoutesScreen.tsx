import type { InputMethod, MatchResult } from '@georally/game-domain/answers'
import { borderGraph } from '@georally/country-catalog/borders'
import {
	getKnownIds,
	getLastMove,
	getMissingIds,
	routeLinks,
	type PlayingRouteState,
	type RouteBoard,
	type RouteLink,
	type RouteMove,
	type RouteState,
} from '@georally/game-domain/singleplayer/routes'
import { useCallback, useMemo, useState } from 'react'
import { useRequestReaction } from '@/shared/feedback'
import { useKeyboardInset } from '@/shared/lib/useKeyboardInset'
import { useMediaQuery } from '@/shared/lib/useMediaQuery'
import { ProjectionToggle } from '@/shared/map/ProjectionToggle'
import { useProjectionPreference } from '@/shared/map/useProjectionPreference'
import { cn } from '@/shared/utils'
import { TOUCH_QUERY } from '../shared/touch'
import { IntroJourney } from './components/RouteJourney'
import { RouteResult } from './components/RouteResult'
import { desktopLayout, touchLayout, type RoutesLayout } from './layouts'
import { GuessList, RouteAnnouncement } from './RouteAnnouncements'
import { RoutesMap } from './map/RoutesMap'
import { useRouteFinish } from './useRouteFinish'
import { RouteIntroContext, useRouteIntro } from './useRouteIntro'
import { useRoutesInput } from './useRoutesInput'
import './route-transitions.css'

const NO_COUNTRIES: readonly string[] = []
const NO_LINKS: readonly RouteLink[] = []

interface RoutesScreenProps {
	state: RouteState
	board: RouteBoard
	onReady: () => void
	onAttempt: (
		method: InputMethod,
		heard: string,
		results: readonly MatchResult[],
	) => void
	onHint: () => void
	onGiveUp: () => void
	onLeave: () => void
	onNext: (() => void) | null
}

export function RoutesScreen({
	state,
	board,
	onReady,
	onAttempt,
	onHint,
	onGiveUp,
	onLeave,
	onNext,
}: RoutesScreenProps) {
	const keyboardInset = useKeyboardInset()
	const requestReaction = useRequestReaction()
	const layout = useMediaQuery(TOUCH_QUERY) ? touchLayout : desktopLayout
	const padding = useMemo(
		() => layout.padding(keyboardInset),
		[keyboardInset, layout],
	)
	const [chosenProjection, setChosenProjection] = useProjectionPreference()
	const globeAllowed =
		state.config.kind === 'daily' || state.config.scope === 'all'
	const projection = globeAllowed ? chosenProjection : 'flat'
	const intro = useRouteIntro(
		state.phase === 'idle',
		state.phase === 'playing',
	)
	const started = state.phase === 'idle' ? null : state

	const knownIds = useMemo(
		() => (started ? [...getKnownIds(started)] : NO_COUNTRIES),
		[started],
	)
	const revealedIds = useMemo(() => {
		if (!started) {
			return NO_COUNTRIES
		}
		const hinted = started.hints.map(hint => hint.countryId)
		return started.phase === 'finished'
			? [...hinted, ...getMissingIds(board, started)]
			: hinted
	}, [board, started])
	const mapIds = useMemo(
		() => [
			...new Set([
				board.startId,
				board.targetId,
				...knownIds,
				...revealedIds,
			]),
		],
		[board, knownIds, revealedIds],
	)
	const links = useMemo(
		() => (started ? routeLinks(borderGraph, board, started) : NO_LINKS),
		[board, started],
	)
	const [settledLinks, setSettledLinks] = useState<
		readonly RouteLink[] | null
	>(null)
	const lastMove = started ? getLastMove(started) : null
	const [openedAt] = useState(lastMove?.at)
	const [newMove, setNewMove] = useState<RouteMove | null>(null)
	if (lastMove && lastMove.at !== openedAt && lastMove.at !== newMove?.at) {
		setNewMove(lastMove)
	}
	const finish = useRouteFinish(board, state, settledLinks === links)

	const leaveFinished = useCallback(() => {
		requestReaction('routes')
		onLeave()
	}, [onLeave, requestReaction])
	const next = useMemo(
		() =>
			onNext &&
			(() => {
				requestReaction('routes')
				onNext()
			}),
		[onNext, requestReaction],
	)

	return (
		<RouteIntroContext value={intro.stage}>
			<section className='relative h-full overflow-hidden'>
				<RoutesMap
					board={board}
					countryIds={mapIds}
					links={links}
					knownIds={knownIds}
					revealedIds={revealedIds}
					chain={finish.chain}
					move={newMove}
					padding={padding}
					finishPadding={layout.finishPadding}
					navigationTop={layout.navigationTop}
					projection={projection}
					pulseEnds={intro.landed}
					finish={finish.camera}
					onReady={onReady}
					onLineSettled={setSettledLinks}
					onFinishMoved={finish.onMoved}
				/>
				{intro.stage === 'intro' ? (
					<div className='pointer-events-none absolute inset-0 z-40 grid place-items-center px-4'>
						<div className='w-full max-w-md scale-[1.15] sm:scale-[1.8]'>
							<IntroJourney
								board={board}
								arrow={layout.journeyArrow}
								onShown={intro.onShown}
							/>
						</div>
					</div>
				) : null}
				<ProjectionToggle
					className={cn('absolute z-30', layout.projectionClassName)}
					value={projection}
					globeDisabled={!globeAllowed}
					onChange={setChosenProjection}
				/>
				{state.phase === 'playing' && intro.stage !== 'intro' ? (
					<PlayingControls
						state={state}
						board={board}
						layout={layout}
						keyboardInset={keyboardInset}
						onAttempt={onAttempt}
						onHint={onHint}
						onGiveUp={onGiveUp}
					/>
				) : null}
				{state.phase === 'finished' ? (
					<RouteResult
						board={board}
						state={state}
						onNext={next}
						onLeave={leaveFinished}
						leaveClassName={layout.leaveClassName}
						headerClassName={layout.finishHeaderClassName}
						headerEnters={finish.restored || layout.finishHeaderMoves}
						nextShown={finish.nextShown}
					/>
				) : null}
				{started ? (
					<>
						<GuessList state={started} board={board} />
						<RouteAnnouncement state={started} board={board} />
					</>
				) : null}
			</section>
		</RouteIntroContext>
	)
}

interface PlayingControlsProps {
	state: PlayingRouteState
	board: RouteBoard
	layout: RoutesLayout
	keyboardInset: number
	onAttempt: RoutesScreenProps['onAttempt']
	onHint: () => void
	onGiveUp: () => void
}

function PlayingControls({
	state,
	board,
	layout,
	keyboardInset,
	onAttempt,
	onHint,
	onGiveUp,
}: PlayingControlsProps) {
	const input = useRoutesInput({ state, onAttempt })
	const { Component: Layout } = layout

	return (
		<Layout
			controls={{ board, state, input, onHint, onGiveUp }}
			keyboardInset={keyboardInset}
		/>
	)
}
