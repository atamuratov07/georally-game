import { countryCatalog } from '@georally/country-catalog'
import {
	getOutcome,
	getQuestionCount,
	getQuestionIndex,
	getTargetId,
	type GameState,
} from '@georally/game-domain/singleplayer/name-it'
import { useCallback, useState } from 'react'
import type { AnswerStage } from '@/game-kit/answering/useAnswerField'
import { useTargetRoundMap } from '@/game-kit/name-round/useTargetRoundMap'

interface RoundViewOptions {
	state: GameState
	upcomingTargetId: string | null
	onBegin: () => void
	onNext: () => void
}

// Name It's run of questions: the camera flies to the next country before its round starts.
export function useRoundView({
	state,
	upcomingTargetId,
	onBegin,
	onNext,
}: RoundViewOptions) {
	const [advancing, setAdvancing] = useState(false)

	const phase = state.phase
	const index = getQuestionIndex(state)
	const total = getQuestionCount(state) || state.config.questionCount
	const targetId = getTargetId(state)
	const outcome = getOutcome(state)
	const targetInfo = targetId
		? countryCatalog.countriesById.get(targetId)
		: undefined
	const revealed = phase === 'revealed' && !advancing
	const round =
		state.phase === 'answering' || state.phase === 'revealed' ? state : null
	const stage: AnswerStage =
		phase === 'answering' && !advancing
			? 'answering'
			: revealed
				? 'revealed'
				: 'waiting'

	const focusCountryId =
		phase === 'idle' || advancing ? upcomingTargetId : targetId
	const focusRound = phase === 'idle' ? 0 : advancing ? index + 1 : index

	const handleSettled = useCallback(() => {
		if (phase === 'idle') {
			onBegin()
		} else if (advancing) {
			setAdvancing(false)
			onNext()
		}
	}, [advancing, onBegin, onNext, phase])

	const map = useTargetRoundMap({
		roundKey: `${focusRound}:${focusCountryId}`,
		targetId: focusCountryId,
		stage,
		correct: outcome === 'correct',
		onSettled: handleSettled,
	})

	const handleNext = useCallback(() => {
		if (upcomingTargetId) {
			setAdvancing(true)
		} else {
			onNext()
		}
	}, [onNext, upcomingTargetId])

	return {
		stage,
		targetId,
		targetInfo,
		outcome,
		revealed,
		timing: round && !advancing ? round : null,
		progress: { current: Math.min(index + 1, total), total },
		map,
		handleNext,
	}
}
