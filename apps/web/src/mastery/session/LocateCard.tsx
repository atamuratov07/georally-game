import { countryCatalog } from '@georally/country-catalog'
import {
	createIdleState,
	getRevealedId,
	getWrongPicks,
	reduceGameState,
	type GameConfig,
	type GameState,
} from '@georally/game-domain/singleplayer/locate'
import {
	locateOutcome,
	type AnswerInput,
	type AnswerOutcome,
} from '@georally/mastery'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PickCountryMap } from '@/shared/map/PickCountryMap'
import type { PickCountryMapProps } from '@/shared/map/types'
import { Button } from '@/shared/ui'
import { CountryInfoCard } from '@/shared/widgets/CountryInfoCard'

const ROUND_CONFIG: GameConfig = {
	questionCount: 1,
	attemptsPerQuestion: 1,
	difficulty: 'easy',
	regions: [],
}

const PLAYABLE_IDS: ReadonlySet<string> = new Set(
	countryCatalog.countriesById.keys(),
)

function startRound(countryId: string, now: number): GameState {
	return reduceGameState(createIdleState(ROUND_CONFIG), {
		type: 'START',
		session: { config: ROUND_CONFIG, questionIds: [countryId] },
		now,
	})
}

interface LocateCardProps {
	countryId: string
	turn: number
	startedAt: number | null
	saving: boolean
	onReady: () => void
	onAnswer: (outcome: AnswerOutcome, at: number) => void
	onNext: () => void
}

export function LocateCard({
	countryId,
	turn,
	startedAt,
	saving,
	onReady,
	onAnswer,
	onNext,
}: LocateCardProps) {
	const { t } = useTranslation()
	const pointer = useRef<AnswerInput>('mouse')
	const fresh = useMemo(
		() => (startedAt === null ? null : startRound(countryId, startedAt)),
		[countryId, startedAt],
	)
	const [played, setPlayed] = useState<{ turn: number; round: GameState }>()
	const round = played?.turn === turn ? played.round : fresh

	const answering = round?.phase === 'answering' ? round : null
	const revealed = round?.phase === 'revealed' ? round : null
	const revealedId = round ? getRevealedId(round) : null
	const revealedInfo = revealedId
		? countryCatalog.countriesById.get(revealedId)
		: undefined

	const highlights = useMemo<PickCountryMapProps['highlights']>(() => {
		if (!round) return []
		const correct = getRevealedId(round)
		return [
			...getWrongPicks(round).map(id => ({
				countryId: id,
				tone: 'wrong' as const,
			})),
			...(correct ? [{ countryId: correct, tone: 'correct' as const }] : []),
		]
	}, [round])

	const revealTarget = useMemo<PickCountryMapProps['revealTarget']>(
		() =>
			revealedId && revealedInfo
				? {
						countryId: revealedId,
						longitude: revealedInfo.centroidLng,
						latitude: revealedInfo.centroidLat,
					}
				: null,
		[revealedId, revealedInfo],
	)

	function resolve(next: GameState, input: AnswerInput | null) {
		setPlayed({ turn, round: next })
		if (next.phase === 'revealed') {
			onAnswer(locateOutcome(next, input), next.resolvedAt)
		}
	}

	return (
		<main
			className='relative min-h-0 flex-1'
			onPointerDownCapture={event => {
				pointer.current = event.pointerType === 'mouse' ? 'mouse' : 'touch'
			}}
		>
			<PickCountryMap
				onPick={id => {
					if (!answering) return
					resolve(
						reduceGameState(answering, {
							type: 'PICK',
							countryId: id,
							now: Date.now(),
						}),
						pointer.current,
					)
				}}
				interactiveIds={PLAYABLE_IDS}
				regions={[]}
				highlights={highlights}
				revealTarget={revealTarget}
				popupElement={
					revealedInfo ? <CountryInfoCard info={revealedInfo} /> : null
				}
				disabled={!answering}
				resetViewKey={answering ? turn : null}
				onReady={onReady}
			/>

			<div className='absolute inset-x-0 bottom-8 z-20 flex justify-center px-4'>
				{revealed ? (
					<Button
						variant='ocean'
						size='lg'
						className='animate-pop-in px-10 [--drop:0_14px_30px_-8px_rgb(24_34_61/0.4)]'
						autoFocus
						pending={saving}
						onClick={onNext}
					>
						{t('singleplayer.next')}
					</Button>
				) : answering ? (
					<Button
						variant='neutral'
						size='sm'
						className='[--drop:0_14px_30px_-8px_rgb(24_34_61/0.35)]'
						onClick={() =>
							resolve(
								reduceGameState(answering, {
									type: 'GIVE_UP',
									now: Date.now(),
								}),
								null,
							)
						}
					>
						{t('singleplayer.giveUp')}
					</Button>
				) : null}
			</div>
		</main>
	)
}
