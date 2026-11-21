import type { InputMethod, MatchResult } from '@georally/game-domain/answers'
import type { PlayingRouteState } from '@georally/game-domain/singleplayer/routes'
import { useCallback, useState } from 'react'
import { useCurrentLocale } from '@/app/LocaleContext'
import { answerMatcher } from '@/shared/answers/matcher'
import { defaultSpeechLanguage } from '@/shared/answers/speechLanguage'
import type { SpeechProblem } from '@/shared/answers/speechRecognition'
import { useContinuousSpeech } from '@/shared/answers/useContinuousSpeech'
import { useTypedAnswer } from '@/shared/answers/useTypedAnswer'

interface RoutesInputOptions {
	state: PlayingRouteState
	onAttempt: (
		method: InputMethod,
		heard: string,
		results: readonly MatchResult[],
	) => void
}

export type RoutesInputState = ReturnType<typeof useRoutesInput>

const NEVER_EARLY = () => false

export function useRoutesInput({ state, onAttempt }: RoutesInputOptions) {
	const locale = useCurrentLocale()
	const [editedAt, setEditedAt] = useState<number | null>(null)

	const last = state.lastAttempt
	const typedAdd =
		last?.method === 'typing' && last.addedIds.length > 0 ? last.at : 0
	const [clearedAt, setClearedAt] = useState(typedAdd)
	if (typedAdd !== clearedAt && typedAdd !== 0) {
		setClearedAt(typedAdd)
	}

	const typed = useTypedAnswer({
		matcher: answerMatcher,
		roundKey: String(clearedAt),
		enabled: true,
		acceptsEarly: NEVER_EARLY,
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
		last.addedIds.length === 0 &&
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
