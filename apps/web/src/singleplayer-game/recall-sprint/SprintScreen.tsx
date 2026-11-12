import { countryCatalog } from '@georally/country-catalog'
import type { InputMethod, MatchResult } from '@georally/game-domain/answers'
import type {
	RunningSprintState,
	SprintState,
} from '@georally/game-domain/singleplayer/recall-sprint'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from '@/app/LocaleContext'
import { useRequestReaction } from '@/shared/feedback'
import { getCountryName } from '@/shared/i18n'
import { useKeyboardInset } from '@/shared/lib/useKeyboardInset'
import { runViewTransition } from '@/shared/lib/viewTransition'
import { useMediaQuery } from '@/shared/lib/useMediaQuery'
import type { ProjectionKind } from '@/shared/map/ProjectionToggle'
import { TOUCH_QUERY } from '../shared/touch'
import { FinalScore } from './components/FinalScore'
import { desktopLayout, touchLayout, type SprintLayout } from './layouts'
import type { ReviewControls } from './reviewControls'
import type { MapChoice, SprintControls } from './sprintControls'
import { SprintMap } from './SprintMap'
import { regionCountryIds } from './sprintRegion'
import { useReview } from './useReview'
import { useSprintInput } from './useSprintInput'

const NO_COUNTRIES: readonly string[] = []
const SCORE_FLIGHT_MS = 650

interface SprintScreenProps {
	state: SprintState
	onReady: () => void
	onAttempt: (
		method: InputMethod,
		heard: string,
		results: readonly MatchResult[],
	) => void
	onFinish: () => void
	onLeave: () => void
}

export function SprintScreen({
	state,
	onReady,
	onAttempt,
	onFinish,
	onLeave,
}: SprintScreenProps) {
	const keyboardInset = useKeyboardInset()
	const requestReaction = useRequestReaction()
	const leaveReview = useCallback(() => {
		requestReaction('recall_sprint')
		onLeave()
	}, [requestReaction, onLeave])
	const layout = useMediaQuery(TOUCH_QUERY) ? touchLayout : desktopLayout
	const [chosenProjection, setChosenProjection] =
		useState<ProjectionKind>('flat')
	const { scope } = state.config
	const globeAllowed = scope === 'all'
	const projection = globeAllowed ? chosenProjection : 'flat'
	const finished = state.phase === 'finished' ? state : null
	const overlays = useMemo(
		() => (finished ? layout.reviewOverlays : layout.overlays(keyboardInset)),
		[finished, keyboardInset, layout],
	)
	const countryIds = useMemo(() => regionCountryIds(scope), [scope])
	const started = state.phase === 'idle' ? null : state
	const missedIds = useMemo(
		() =>
			finished
				? finished.countryIds.filter(
						countryId => !finished.found.includes(countryId),
					)
				: null,
		[finished],
	)
	const review = useReview(missedIds, scope)

	const mapChoice: MapChoice = {
		projection,
		globeAllowed,
		onProjectionChange: setChosenProjection,
	}

	return (
		<section className='relative h-full overflow-hidden'>
			<SprintMap
				projection={projection}
				scope={scope}
				countryIds={countryIds}
				found={started?.found ?? NO_COUNTRIES}
				attempt={started?.lastAttempt ?? null}
				overlays={overlays}
				navigationTop={layout.navigationTop}
				review={
					finished
						? { activeId: review.activeId, onSelect: review.select }
						: null
				}
				onReady={onReady}
			/>

			{state.phase === 'running' ? (
				<RunningControls
					state={state}
					layout={layout}
					keyboardInset={keyboardInset}
					map={mapChoice}
					onAttempt={onAttempt}
					onFinish={onFinish}
					onLeave={onLeave}
				/>
			) : null}
			{finished ? (
				<FinishedControls
					layout={layout}
					controls={{
						found: finished.found.length,
						total: finished.countryIds.length,
						endedBy: finished.endedBy,
						missedCount: review.missedCount,
						position: review.position,
						map: mapChoice,
						onStep: review.step,
						onLeave: leaveReview,
					}}
				/>
			) : null}
		</section>
	)
}

interface RunningControlsProps {
	state: RunningSprintState
	layout: SprintLayout
	keyboardInset: number
	map: MapChoice
	onAttempt: SprintScreenProps['onAttempt']
	onFinish: () => void
	onLeave: () => void
}

function RunningControls({
	state,
	layout,
	keyboardInset,
	map,
	onAttempt,
	onFinish,
	onLeave,
}: RunningControlsProps) {
	const input = useSprintInput({ state, onAttempt })
	const controls: SprintControls = {
		input,
		scope: state.config.scope,
		found: state.found.length,
		total: state.countryIds.length,
		timer: {
			deadlineAt: state.deadlineAt,
			frozenAt: null,
			limitMs: state.durationMs,
		},
		onLeave,
		onFinish,
		map,
	}
	const { Component: Layout } = layout

	return (
		<>
			<FoundAnnouncement state={state} />
			<Layout controls={controls} keyboardInset={keyboardInset} />
		</>
	)
}

function FinishedControls({
	layout,
	controls,
}: {
	layout: SprintLayout
	controls: ReviewControls
}) {
	const [scoreShown, setScoreShown] = useState(true)
	const handleScoreDone = useCallback(() => {
		void runViewTransition('final-score', SCORE_FLIGHT_MS, () =>
			setScoreShown(false),
		)
	}, [])

	return scoreShown ? (
		<FinalScore
			found={controls.found}
			total={controls.total}
			onDone={handleScoreDone}
		/>
	) : (
		<layout.Review controls={controls} />
	)
}

function FoundAnnouncement({ state }: { state: RunningSprintState }) {
	const { t } = useTranslation()
	const language = useCurrentLocale()
	const foundIds = state.lastAttempt?.foundIds ?? NO_COUNTRIES
	const names = foundIds
		.map(countryId => {
			const info = countryCatalog.countriesById.get(countryId)
			return info ? getCountryName(info, language) : countryId
		})
		.join(', ')

	return (
		<p className='sr-only' aria-live='polite'>
			{names
				? t('recallSprint.announce', {
						names,
						found: state.found.length,
						total: state.countryIds.length,
					})
				: null}
		</p>
	)
}
