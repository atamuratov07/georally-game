import type { InputMethod, MatchResult } from '@georally/game-domain/answers'
import type { RunningSprintState } from '@georally/game-domain/singleplayer/recall-sprint'
import { useCallback, useMemo, useState } from 'react'
import { useCurrentLocale } from '@/app/LocaleContext'
import { answerMatcher } from '@/shared/answers/matcher'
import { defaultSpeechLanguage } from '@/shared/answers/speechLanguage'
import type { SpeechProblem } from '@/shared/answers/speechRecognition'
import { useContinuousSpeech } from '@/shared/answers/useContinuousSpeech'
import { useTypedAnswer } from '@/shared/answers/useTypedAnswer'

interface SprintInputOptions {
	state: RunningSprintState
	onAttempt: (
		method: InputMethod,
		heard: string,
		results: readonly MatchResult[],
	) => void
}

export type SprintInputState = ReturnType<typeof useSprintInput>

export function useSprintInput({ state, onAttempt }: SprintInputOptions) {
	const locale = useCurrentLocale()
	const regional = useMemo(() => new Set(state.countryIds), [state.countryIds])
	const found = useMemo(() => new Set(state.found), [state.found])
	const [editedAt, setEditedAt] = useState<number | null>(null)

	const last = state.lastAttempt
	const [typedFindAt, setTypedFindAt] = useState(() =>
		last?.method === 'typing' && last.foundIds.length > 0 ? last.at : 0,
	)
	if (
		last?.method === 'typing' &&
		last.foundIds.length > 0 &&
		last.at !== typedFindAt
	) {
		setTypedFindAt(last.at)
	}

	const typed = useTypedAnswer({
		matcher: answerMatcher,
		roundKey: String(typedFindAt),
		enabled: true,
		acceptsEarly: useCallback(
			(countryId: string) =>
				regional.has(countryId) && !found.has(countryId),
			[found, regional],
		),
		onAnswer: useCallback(
			(result: MatchResult) => onAttempt('typing', result.heard, [result]),
			[onAttempt],
		),
	})

	const speech = useContinuousSpeech({
		lang: defaultSpeechLanguage(locale),
		onFinal: useCallback(
			(alternatives: string[]) =>
				onAttempt(
					'voice',
					alternatives[0] ?? '',
					answerMatcher.matchAll(alternatives, 'voice'),
				),
			[onAttempt],
		),
	})
	const mistake =
		last?.method === 'typing' &&
		last.foundIds.length === 0 &&
		(editedAt === null || last.at >= editedAt)
			? last
			: null
	const notice: SpeechProblem | null = speech.denied ? 'denied' : speech.notice

	return {
		text: typed.text,
		change: (value: string) => {
			setEditedAt(Date.now())
			typed.change(value)
		},
		submit: typed.submit,
		mistake,
		voiceAvailable: speech.available,
		listening: speech.listening,
		interim: speech.interim,
		toggleVoice: speech.listening ? speech.stop : speech.start,
		notice,
	}
}
