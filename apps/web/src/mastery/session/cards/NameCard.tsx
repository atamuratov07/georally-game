import type { InputMethod, MatchResult } from '@georally/game-domain/answers'
import {
	createIdleState,
	getLastAttempt,
	reduceGameState,
	type GameAction,
	type GameConfig,
	type GameState,
} from '@georally/game-domain/singleplayer/name-it'
import { nameOutcome, type AnswerInput } from '@georally/mastery'
import { useCallback, useMemo, useState } from 'react'
import { useCurrentLocale } from '@/app/LocaleContext'
import type { AnswerStage } from '@/game-kit/answering/useAnswerField'
import { useAnswerInput } from '@/game-kit/answering/useAnswerInput'
import { NameRoundLayer } from '@/game-kit/name-round/NameRoundLayer'
import { NameRoundMap } from '@/game-kit/name-round/NameRoundMap'
import { useNameRoundScreen } from '@/game-kit/name-round/useNameRoundScreen'
import {
	useTargetRoundMap,
	type FocusKind,
} from '@/game-kit/name-round/useTargetRoundMap'
import { getCountryName } from '@/shared/i18n'
import { keepInputFocus } from '@/shared/lib/keepInputFocus'
import { useDocumentScrollLock } from '@/shared/lib/useDocumentScrollLock'
import { useDeadline } from '@/shared/time/useDeadline'
import type { ReviewCardProps } from './types'
import { useCardRound } from './useCardRound'

const ROUND_CONFIG: GameConfig = {
	questionCount: 1,
	difficulty: 'easy',
	regions: [],
	timeLimitMs: 20_000,
	inputs: ['typing', 'voice'],
}

function startRound(countryId: string, now: number): GameState {
	return reduceGameState(createIdleState(ROUND_CONFIG), {
		type: 'START',
		session: { config: ROUND_CONFIG, questionIds: [countryId] },
		now,
	})
}

export function NameCard({
	countryId,
	turn,
	startedAt,
	saving,
	onReady,
	onAnswer,
	onNext,
}: ReviewCardProps) {
	const language = useCurrentLocale()
	const [framed, setFramed] = useState<{ turn: number; at: number } | null>(
		null,
	)
	useDocumentScrollLock()

	// The clock starts once the camera has framed the country.
	const framedAt = framed?.turn === turn ? framed.at : null
	const fresh = useMemo(
		() =>
			startedAt === null || framedAt === null
				? null
				: startRound(countryId, Math.max(startedAt, framedAt)),
		[countryId, framedAt, startedAt],
	)
	const { round, resolve } = useCardRound(turn, fresh, (next, input) => {
		if (next.phase === 'revealed') {
			onAnswer(nameOutcome(next, input), next.resolvedAt)
		}
	})
	const answering = round?.phase === 'answering' ? round : null
	const revealed = round?.phase === 'revealed' ? round : null
	const stage: AnswerStage = answering
		? 'answering'
		: revealed
			? 'revealed'
			: 'waiting'

	const handleSettled = useCallback(
		(focus: FocusKind) => {
			if (focus !== 'round') return
			setFramed({ turn, at: Date.now() })
			onReady()
		},
		[onReady, turn],
	)
	const map = useTargetRoundMap({
		roundKey: String(turn),
		targetId: countryId,
		stage,
		correct: revealed?.outcome === 'correct',
		onSettled: handleSettled,
	})
	const screen = useNameRoundScreen({ globeAllowed: true })

	function act(action: GameAction, input: AnswerInput | null) {
		if (answering) resolve(reduceGameState(answering, action), input)
	}
	const input = useAnswerInput({
		answering: answering !== null,
		roundKey: String(turn),
		targetId: countryId,
		onAnswer: (method: InputMethod, result: MatchResult) =>
			act({ type: 'ATTEMPT', method, result, now: Date.now() }, method),
	})
	useDeadline(answering?.deadlineAt ?? null, () =>
		act({ type: 'TIME_UP', now: Date.now() }, null),
	)

	const name = map.targetInfo ? getCountryName(map.targetInfo, language) : null

	return (
		<main
			className='relative min-h-0 flex-1 touch-none overflow-hidden'
			onPointerDownCapture={keepInputFocus}
		>
			<p className='sr-only' aria-live='polite'>
				{revealed ? name : ''}
			</p>
			<NameRoundMap screen={screen} map={map} />
			<NameRoundLayer
				screen={screen}
				map={map}
				controls={{
					stage,
					answer:
						revealed && name
							? { name, correct: revealed.outcome === 'correct' }
							: null,
					lastAttempt: round ? getLastAttempt(round) : null,
					input,
					timer: {
						deadlineAt: (answering ?? revealed)?.deadlineAt ?? null,
						frozenAt: revealed?.resolvedAt ?? null,
						limitMs: ROUND_CONFIG.timeLimitMs,
					},
					canGiveUp: answering !== null,
					onGiveUp: () => act({ type: 'GIVE_UP', now: Date.now() }, null),
					nextPending: saving,
					onNext,
				}}
			/>
		</main>
	)
}
