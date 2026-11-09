import type { InputMethod, MatchResult } from '@georally/game-domain/answers'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useCurrentLocale } from '@/app/LocaleContext'
import { answerMatcher } from '@/shared/answers/matcher'
import { defaultSpeechLanguage } from '@/shared/answers/speechLanguage'
import {
	useSpeechRecognition,
	type SpeechNotice,
} from '@/shared/answers/useSpeechRecognition'
import { useTypedAnswer } from '@/shared/answers/useTypedAnswer'

interface AnswerInputOptions {
	answering: boolean
	roundKey: string
	targetId: string | null
	onAnswer: (method: InputMethod, result: MatchResult) => void
}

export type AnswerInputState = ReturnType<typeof useAnswerInput>

export function useAnswerInput({
	answering,
	roundKey,
	targetId,
	onAnswer,
}: AnswerInputOptions) {
	const locale = useCurrentLocale()
	const sessionAnsweredRef = useRef(false)
	const [attemptStartedAt, setAttemptStartedAt] = useState<number | null>(null)

	const typed = useTypedAnswer({
		matcher: answerMatcher,
		roundKey,
		enabled: answering,
		acceptsEarly: useCallback(
			(countryId: string) => countryId === targetId,
			[targetId],
		),
		onAnswer: useCallback(
			(result: MatchResult) => onAnswer('typing', result),
			[onAnswer],
		),
	})

	const answerByVoice = useCallback(
		(result: MatchResult) => {
			sessionAnsweredRef.current = true
			onAnswer('voice', result)
		},
		[onAnswer],
	)

	const speech = useSpeechRecognition({
		lang: defaultSpeechLanguage(locale),
		onInterim: useCallback(
			(text: string) => {
				const early = answerMatcher.matchAsTyped(text)
				if (
					!sessionAnsweredRef.current &&
					early?.countryId === targetId &&
					!early.isPrefix
				) {
					answerByVoice(answerMatcher.match([text], 'voice'))
				}
			},
			[answerByVoice, targetId],
		),
		onFinal: useCallback(
			(alternatives: string[]) => {
				if (!sessionAnsweredRef.current) {
					answerByVoice(answerMatcher.match(alternatives, 'voice'))
				}
			},
			[answerByVoice],
		),
	})
	const { abort: abortVoice, start: startListening, stop: stopVoice } = speech

	useEffect(() => {
		if (!answering) {
			abortVoice()
		}
	}, [abortVoice, answering])

	const { clear: clearTyped } = typed
	const startVoice = useCallback(() => {
		setAttemptStartedAt(Date.now())
		clearTyped()
		sessionAnsweredRef.current = false
		startListening()
	}, [clearTyped, startListening])

	const change = (value: string) => {
		if (answering) {
			setAttemptStartedAt(Date.now())
		}
		if (speech.listening) {
			abortVoice()
		}
		typed.change(value)
	}

	const notice: SpeechNotice | 'denied' | null = speech.denied
		? 'denied'
		: speech.notice

	const submit = () => {
		if (!typed.text.trim() && speech.available && !speech.listening) {
			startVoice()
		} else {
			typed.submit()
		}
	}

	return {
		text: typed.text,
		attemptStartedAt,
		change,
		submit,
		toggleVoice: speech.listening ? stopVoice : startVoice,
		voiceAvailable: speech.available,
		listening: speech.listening,
		interim: speech.interim,
		notice,
	}
}
