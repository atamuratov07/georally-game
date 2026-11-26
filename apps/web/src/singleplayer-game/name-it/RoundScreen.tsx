import type { InputMethod, MatchResult } from '@georally/game-domain/answers'
import {
	getLastAttempt,
	getRoundPoints,
	getScore,
	type GameState,
} from '@georally/game-domain/singleplayer/name-it'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from '@/app/LocaleContext'
import { useAnswerInput } from '@/game-kit/answering/useAnswerInput'
import { ProgressChip, ProgressText } from '@/game-kit/hud/Progress'
import { ScoreBanner } from '@/game-kit/hud/ScoreBanner'
import { NameRoundLayer } from '@/game-kit/name-round/NameRoundLayer'
import { NameRoundMap } from '@/game-kit/name-round/NameRoundMap'
import type { NameRoundControls } from '@/game-kit/name-round/types'
import { useNameRoundScreen } from '@/game-kit/name-round/useNameRoundScreen'
import { getCountryName } from '@/shared/i18n'
import { regionsView } from '@/shared/map/continent-view'
import { LeaveButton } from '../shared/components/LeaveButton'
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
	const view = useRoundView({ state, upcomingTargetId, onBegin, onNext })
	const input = useAnswerInput({
		answering: view.stage === 'answering',
		roundKey: view.map.roundKey,
		targetId: view.targetId,
		onAnswer,
	})

	const targetName = view.targetInfo
		? getCountryName(view.targetInfo, language)
		: null
	const resolvedAt =
		view.timing?.phase === 'revealed' ? view.timing.resolvedAt : null
	const score = {
		triggerKey: resolvedAt,
		isCorrect: view.outcome === null ? null : view.outcome === 'correct',
		totalScore: getScore(state),
		awardedScore: getRoundPoints(state) ?? 0,
	}

	const screen = useNameRoundScreen({
		globeAllowed: regionsView(state.config.regions) === null,
		slots: kind => ({
			topStart: <LeaveButton mode='name-it' />,
			topEnd:
				kind === 'touch' ? (
					<ProgressText {...view.progress} />
				) : (
					<ProgressChip {...view.progress} />
				),
			overlay: (
				<ScoreBanner
					className={
						kind === 'touch' ? 'top-20 origin-top scale-80' : 'top-20'
					}
					{...score}
				/>
			),
		}),
	})

	const controls: NameRoundControls = {
		stage: view.stage,
		answer:
			view.revealed && targetName
				? { name: targetName, correct: view.outcome === 'correct' }
				: null,
		lastAttempt: getLastAttempt(state),
		input,
		timer: {
			deadlineAt: view.timing?.deadlineAt ?? null,
			frozenAt: resolvedAt,
			limitMs: state.config.timeLimitMs,
		},
		canGiveUp: view.stage === 'answering' && view.map.settled,
		onGiveUp,
		onNext: view.handleNext,
	}

	return (
		<section className='relative h-full overflow-hidden'>
			<h1 className='sr-only' aria-live='polite'>
				{view.revealed && targetName
					? targetName
					: t('game.progress', view.progress)}
			</h1>

			<NameRoundMap screen={screen} map={view.map} />
			{state.phase === 'finished' ? null : (
				<NameRoundLayer
					screen={screen}
					map={view.map}
					controls={controls}
				/>
			)}
		</section>
	)
}
