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
import { useMemo } from 'react'
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
import { useTranslation } from 'react-i18next'
import { getCountryName } from '../../shared/i18n'
import { useCurrentLocale } from '../../app/LocaleContext'

interface GameScreenProps {
	state: GameState
	eligibleIds: string[]
	countriesInfo: Map<string, CountryInfo>
	onPick: (countryId: string) => void
	onGiveUp: () => void
	onNext: () => void
}

export function GameScreen({
	state,
	eligibleIds,
	countriesInfo,
	onPick,
	onGiveUp,
	onNext,
}: GameScreenProps) {
	const { t } = useTranslation()
	const language = useCurrentLocale()
	const targetId = getTargetId(state)
	const targetInfo = targetId ? countriesInfo.get(targetId) : undefined
	const revealedId = getRevealedId(state)
	const wrongPicks = getWrongPicks(state)
	const questionCount = getQuestionCount(state)
	const questionIndex = getQuestionIndex(state)
	const startedAt = getStartedAt(state)
	const resolvedAt = getResolvedAt(state)
	const attemptsLeft = getAttemptsLeft(state)
	const totalScore = getScore(state)
	const outcome = getOutcome(state)
	const answering = isAnswering(state)

	const revealedInfo = revealedId ? countriesInfo.get(revealedId) : undefined

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
	}

	const showHearts = state.phase === 'answering' || state.phase === 'revealed'

	return (
		<section className='flex h-full flex-col overflow-hidden bg-paper'>
			<GameHeader
				questionIndex={questionIndex}
				questionCount={questionCount}
				targetName={targetInfo ? getCountryName(targetInfo, language) : ''}
				targetFlagUrl={targetInfo?.flagUrl}
				isAnswering={answering}
				startedAt={startedAt}
				resolvedAt={resolvedAt}
			/>

			<main className='relative min-h-0 flex-1'>
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
							onClick={onNext}
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
		</section>
	)
}
