import type { CountryInfo } from '@georally/country-catalog'
import {
	getAttemptsLeft,
	getIsCorrect,
	getQuestionCount,
	getQuestionIndex,
	getQuestionResolvedAt,
	getQuestionStartedAt,
	getRevealedId,
	getScore,
	getTargetId,
	getWrongPicks,
	isPickAllowed,
	type GameState,
} from '@georally/game-domain/singleplayer'
import { useEffect, useMemo, useRef } from 'react'
import { MapRenderer } from '../../shared/map/MapRenderer'
import type { MapHighlightTone, MapRendererProps } from '../../shared/map/types'
import { ScoreBanner } from '../../shared/widgets/ScoreBanner'
import { CountryInfoCard } from '../../shared/widgets/CountryInfoCard'
import { Button } from '../../shared/ui'
import { GameHeader } from '../components/GameHeader'
import { Hearts } from '../components/Hearts'
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
	const questionStartedAt = getQuestionStartedAt(state)
	const questionResolvedAt = getQuestionResolvedAt(state)
	const attemptsLeft = getAttemptsLeft(state)
	const totalScore = getScore(state)
	const isCorrect = getIsCorrect(state)
	const previousScoreRef = useRef(totalScore)

	const revealedInfo = revealedId ? countriesInfo.get(revealedId) : undefined

	const revealTarget = useMemo<MapRendererProps['revealTarget']>(() => {
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

	const highlights = useMemo<MapRendererProps['highlights']>(() => {
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

	const canPick = isPickAllowed(state)
	const scoreAwarded = totalScore - previousScoreRef.current

	const mapProps: MapRendererProps = {
		onPick: canPick ? onPick : () => undefined,
		interactiveIds,
		scope: state.config.scope,
		highlights: highlights,
		revealTarget,
		popupElement: revealedInfo ? (
			<CountryInfoCard info={revealedInfo} />
		) : null,
		disabled: !canPick,
		resetViewKey:
			state.phase === 'playing'
				? `${questionIndex}:${questionStartedAt}`
				: null,
	}

	const showHearts = state.phase === 'playing' || state.phase === 'revealed'

	useEffect(() => {
		if (state.phase === 'revealed') {
			return
		}
		previousScoreRef.current = totalScore
	}, [state.phase, totalScore])

	return (
		<section className='flex h-full flex-col overflow-hidden'>
			<GameHeader
				questionIndex={questionIndex}
				questionCount={questionCount}
				targetName={
					targetInfo
						? getCountryName(targetInfo, language)
						: t('singleplayer.gameFinished')
				}
				targetFlagUrl={targetInfo?.flagUrl}
				isPlaying={state.phase === 'playing'}
				questionStartedAt={questionStartedAt}
				questionResolvedAt={questionResolvedAt}
				onGiveUp={onGiveUp}
			/>

			<main className='relative min-h-0 flex-1'>
				<MapRenderer {...mapProps} />

				<ScoreBanner
					triggerKey={questionResolvedAt}
					isCorrect={isCorrect}
					totalScore={totalScore}
					awardedScore={scoreAwarded}
				/>

				{showHearts ? (
					<div className='absolute right-4 top-4 z-20'>
						<Hearts
							attemptsLeft={attemptsLeft}
							maxAttempts={state.config.attemptsPerQuestion}
						/>
					</div>
				) : null}

				{state.phase === 'revealed' ? (
					<div className='absolute bottom-8 left-1/2 z-20 -translate-x-1/2'>
						<Button
							type='button'
							variant='teal'
							size='sm'
							is3d
							className='px-4 py-2.5'
							onClick={onNext}
						>
							{t('singleplayer.nextQuestion')}
						</Button>
					</div>
				) : null}
			</main>
		</section>
	)
}
