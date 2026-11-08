import type { AnswerMatcher, MatchResult } from '@georally/game-domain/answers'
import { useCallback, useEffect, useRef, useState } from 'react'

const PREFIX_PAUSE_MS = 600

interface TypedAnswerOptions {
	matcher: AnswerMatcher
	acceptsEarly: (countryId: string) => boolean
	onAnswer: (result: MatchResult) => void
}

export function useTypedAnswer({
	matcher,
	acceptsEarly,
	onAnswer,
}: TypedAnswerOptions) {
	const [text, setText] = useState('')
	const pauseTimerRef = useRef<number | null>(null)

	const cancelPause = useCallback(() => {
		if (pauseTimerRef.current !== null) {
			clearTimeout(pauseTimerRef.current)
			pauseTimerRef.current = null
		}
	}, [])

	useEffect(() => cancelPause, [cancelPause])

	const submitText = useCallback(
		(value: string) => {
			cancelPause()
			if (value.trim()) {
				onAnswer(matcher.match([value], 'typing'))
			}
		},
		[cancelPause, matcher, onAnswer],
	)

	const change = useCallback(
		(value: string) => {
			setText(value)
			cancelPause()

			const typed = matcher.matchAsTyped(value)
			if (!typed || !acceptsEarly(typed.countryId)) {
				return
			}
			if (!typed.isPrefix) {
				submitText(value)
				return
			}

			pauseTimerRef.current = window.setTimeout(
				() => submitText(value),
				PREFIX_PAUSE_MS,
			)
		},
		[acceptsEarly, cancelPause, matcher, submitText],
	)

	return { text, change, submit: () => submitText(text) }
}
