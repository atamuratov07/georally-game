import type { CountryInfo } from '@georally/country-catalog'
import {
	getAttemptsLeft,
	getOutcome,
	getQuestionCount,
	getQuestionIndex,
	getResolvedAt,
	getRevealedId,
	getRoundPoints,
	getScore,
	getStartedAt,
	getTargetId,
	getWrongPicks,
	isAnswering,
	type GameState,
} from '@georally/game-domain/singleplayer/locate'
import { useEffect, useMemo } from 'react'
import { PickCountryMap } from '../../shared/map/PickCountryMap'
import type {
	MapHighlightTone,
	PickCountryMapProps,
} from '../../shared/map/types'
import { ScoreBanner } from '../../shared/widgets/ScoreBanner'
import { CountryInfoCard } from '../../shared/widgets/CountryInfoCard'
import { Button } from '@/shared/ui'
import { GameHeader } from './components/GameHeader'
import { Hearts } from './components/Hearts'
import { RoundIntro } from './components/RoundIntro'
import { RoundPanel } from './components/RoundPanel'
import type { RoundInfo } from './components/RoundSplash'
import { useRoundStages } from './useRoundStages'
import { useTranslation } from 'react-i18next'
import { getCountryName } from '../../shared/i18n'
import { useCurrentLocale } from '../../app/LocaleContext'
import './round-transitions.css'

interface GameScreenProps {
	state: GameState
	eligibleIds: string[]
	countriesInfo: Map<string, CountryInfo>
	upcomingTargetId: string | null
	onBegin: (startsAt: number) => void
	onPick: (countryId: string) => void
	onGiveUp: () => void
	onNext: (startsAt: number) => void
}

export function GameScreen({
	state,
	eligibleIds,
	countriesInfo,
	upcomingTargetId,
	onBegin,
	onPick,
	onGiveUp,
	onNext,
}: GameScreenProps) {
	const { t } = useTranslation()
	const language = useCurrentLocale()
	const targetId = getTargetId(state) ?? upcomingTargetId
	const targetInfo = targetId ? countriesInfo.get(targetId) : undefined
	const revealedId = getRevealedId(state)
	const wrongPicks = getWrongPicks(state)
	const questionCount = getQuestionCount(state) || state.config.questionCount
	const questionIndex = getQuestionIndex(state)
	const startedAt = getStartedAt(state)
	const resolvedAt = getResolvedAt(state)
	const attemptsLeft = getAttemptsLeft(state)
	const totalScore = getScore(state)
	const outcome = getOutcome(state)
	const answering = isAnswering(state)

	const round: RoundInfo = {
		current: Math.min(questionIndex + 1, questionCount),
		total: questionCount,
		completed: Math.min(
			questionIndex + (state.phase === 'revealed' ? 1 : 0),
			questionCount,
		),
		name: targetInfo ? getCountryName(targetInfo, language) : '',
		flagUrl: targetInfo?.flagUrl,
	}

	const { stage, handleMapReady, handleNext } = useRoundStages({
		showIntro: state.phase !== 'finished',
		hasNextRound: questionIndex + 1 < questionCount,
		onBegin,
		onNext,
	})
	const panelShown =
		stage === 'intro' || stage === 'ready' || stage === 'round'

	const revealedInfo = revealedId ? countriesInfo.get(revealedId) : undefined

	const nextTargetId =
		state.phase === 'answering' || state.phase === 'revealed'
			? state.questionIds[state.index + 1]
			: undefined
	const nextFlagUrl = nextTargetId
		? countriesInfo.get(nextTargetId)?.flagUrl
		: undefined

	useEffect(() => {
		if (nextFlagUrl) {
			new Image().src = nextFlagUrl
		}
	}, [nextFlagUrl])

	const revealTarget = useMemo<PickCountryMapProps['revealTarget']>(() => {
		if (!revealedId || !revealedInfo) {
			return null
		}

		return {
			countryId: revealedId,
			longitude: revealedInfo.centroidLng,
			latitude: revealedInfo.centroidLat,
		}
	}, [revealedInfo, revealedId])

	const interactiveIds = useMemo<ReadonlySet<string>>(
		() => new Set(eligibleIds),
		[eligibleIds],
	)

	const highlights = useMemo<PickCountryMapProps['highlights']>(() => {
		const nextHighlights = wrongPicks.map(countryId => ({
			countryId,
			tone: 'wrong' as MapHighlightTone,
		}))

		if (revealedId) {
			nextHighlights.push({
				countryId: revealedId,
				tone: 'correct',
			})
		}

		return nextHighlights
	}, [revealedId, wrongPicks])

	const mapProps: PickCountryMapProps = {
		onPick: answering ? onPick : () => undefined,
		interactiveIds,
		scope: state.config.scope,
		highlights: highlights,
		revealTarget,
		popupElement: revealedInfo ? (
			<CountryInfoCard info={revealedInfo} />
		) : null,
		disabled: !answering,
		resetViewKey: answering ? `${questionIndex}:${startedAt}` : null,
		onReady: handleMapReady,
	}

	const showHearts = state.phase === 'answering' || state.phase === 'revealed'

	return (
		<section className='flex h-full flex-col overflow-hidden bg-paper'>
			<GameHeader
				round={round}
				isAnswering={answering}
				startedAt={startedAt}
				resolvedAt={resolvedAt}
				hidden={panelShown}
				transitionParts={
					stage === 'header'
						? 'full'
						: stage === 'swapping'
							? 'frame'
							: undefined
				}
			/>

			<main className='relative min-h-0 flex-1' inert={panelShown}>
				<PickCountryMap {...mapProps} />

				<ScoreBanner
					triggerKey={resolvedAt}
					isCorrect={outcome === null ? null : outcome === 'correct'}
					totalScore={totalScore}
					awardedScore={getRoundPoints(state) ?? 0}
				/>

				{showHearts ? (
					<div className='absolute top-2 right-3 z-20'>
						<Hearts
							attemptsLeft={attemptsLeft}
							maxAttempts={state.config.attemptsPerQuestion}
						/>
					</div>
				) : null}

				<div className='absolute inset-x-0 bottom-8 z-20 flex justify-center px-4'>
					{state.phase === 'revealed' ? (
						<Button
							type='button'
							variant='ocean'
							size='lg'
							className='animate-pop-in px-10 [--drop:0_14px_30px_-8px_rgb(24_34_61/0.4)]'
							autoFocus
							onClick={handleNext}
						>
							{t('singleplayer.next')}
						</Button>
					) : answering ? (
						<Button
							type='button'
							variant='neutral'
							size='sm'
							className='[--drop:0_14px_30px_-8px_rgb(24_34_61/0.35)]'
							onClick={onGiveUp}
						>
							{t('singleplayer.giveUp')}
						</Button>
					) : null}
				</div>
			</main>

			{stage === 'intro' || stage === 'ready' ? (
				<RoundIntro round={round} ready={stage === 'ready'} />
			) : null}
			{stage === 'round' ? <RoundPanel round={round} /> : null}
		</section>
	)
}
