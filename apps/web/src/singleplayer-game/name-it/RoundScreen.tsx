import type { InputMethod, MatchResult } from '@georally/game-domain/answers'
import {
	getLastAttempt,
	getRoundPoints,
	getScore,
	type GameState,
} from '@georally/game-domain/singleplayer/name-it'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from '@/app/LocaleContext'
import { getCountryName } from '@/shared/i18n'
import { useKeyboardInset } from '@/shared/lib/useKeyboardInset'
import { useMediaQuery } from '@/shared/lib/useMediaQuery'
import type { ProjectionKind } from '@/shared/map/ProjectionToggle'
import { CountryInfoCard } from '@/shared/widgets/CountryInfoCard'
import { desktopLayout, TOUCH_QUERY, touchLayout } from './layouts'
import { NameItMap } from './NameItMap'
import type { RoundControls } from './roundControls'
import { useAnswerInput } from './useAnswerInput'
import { useRoundView } from './useRoundView'

interface RoundScreenProps {
	state: GameState
	upcomingTargetId: string | null
	onBegin: () => void
	onAnswer: (method: InputMethod, result: MatchResult) => void
	onGiveUp: () => void
	onNext: () => void
}

export function RoundScreen({
	state,
	upcomingTargetId,
	onBegin,
	onAnswer,
	onGiveUp,
	onNext,
}: RoundScreenProps) {
	const { t } = useTranslation()
	const language = useCurrentLocale()
	const keyboardInset = useKeyboardInset()
	const layout = useMediaQuery(TOUCH_QUERY) ? touchLayout : desktopLayout
	const view = useRoundView({ state, upcomingTargetId, onBegin, onNext })
	const input = useAnswerInput({
		answering: view.stage === 'answering',
		roundKey: view.roundKey,
		targetId: view.targetId,
		onAnswer,
	})
	const [chosenProjection, setChosenProjection] =
		useState<ProjectionKind>('flat')
	const [cardHidden, setCardHidden] = useState(false)
	const globeAllowed = state.config.scope === 'all'
	const projection = globeAllowed ? chosenProjection : 'flat'
	const insets = useMemo(
		() => layout.insets(keyboardInset),
		[keyboardInset, layout],
	)

	const targetName = view.targetInfo
		? getCountryName(view.targetInfo, language)
		: null
	const resolvedAt =
		view.timing?.phase === 'revealed' ? view.timing.resolvedAt : null

	const controls: RoundControls = {
		stage: view.stage,
		answer:
			view.revealed && targetName
				? { name: targetName, correct: view.outcome === 'correct' }
				: null,
		lastAttempt: getLastAttempt(state),
		input,
		progress: view.progress,
		timer: {
			deadlineAt: view.timing?.deadlineAt ?? null,
			frozenAt: resolvedAt,
			limitMs: state.config.timeLimitMs,
		},
		score: {
			triggerKey: resolvedAt,
			isCorrect: view.outcome === null ? null : view.outcome === 'correct',
			totalScore: getScore(state),
			awardedScore: getRoundPoints(state) ?? 0,
		},
		map: {
			projection,
			globeAllowed,
			onProjectionChange: setChosenProjection,
			hasCard: view.reveal !== null,
			cardHidden,
			onCardHiddenChange: setCardHidden,
		},
		canGiveUp: view.stage === 'answering' && view.isRoundSettled,
		onGiveUp,
		onNext: view.handleNext,
	}

	const { Component: Layout } = layout

	return (
		<section className='relative h-full overflow-hidden'>
			<h1 className='sr-only' aria-live='polite'>
				{view.revealed && targetName
					? targetName
					: t('game.progress', view.progress)}
			</h1>

			<NameItMap
				projection={projection}
				focus={view.focus}
				targetId={view.targetId}
				outlined={state.phase === 'answering' && view.isRoundSettled}
				highlights={view.highlights}
				labelIds={view.labelIds}
				markers={view.markers}
				reveal={view.reveal}
				popup={
					view.reveal && view.targetInfo ? (
						<CountryInfoCard info={view.targetInfo} />
					) : null
				}
				insets={insets}
				cardHidden={cardHidden}
				navigationTop={layout.navigationTop}
				onFocusSettled={view.handleFocusSettled}
			/>

			{state.phase === 'finished' ? null : (
				<Layout controls={controls} keyboardInset={keyboardInset} />
			)}
		</section>
	)
}
