import type { AnswerMatcher, MatchResult } from '@georally/game-domain/answers'
import { useCallback, useEffect, useRef, useState } from 'react'

const PREFIX_PAUSE_MS = 600

interface TypedAnswerOptions {
	matcher: AnswerMatcher
	roundKey: string
	enabled: boolean
	acceptsEarly: (countryId: string) => boolean
	onAnswer: (result: MatchResult) => void
}

export function useTypedAnswer({
	matcher,
	roundKey,
	enabled,
	acceptsEarly,
	onAnswer,
}: TypedAnswerOptions) {
	const [entry, setEntry] = useState({ roundKey, text: '' })
	const text = entry.roundKey === roundKey ? entry.text : ''
	const pauseTimerRef = useRef<number | null>(null)

	const cancelPause = useCallback(() => {
		if (pauseTimerRef.current !== null) {
			clearTimeout(pauseTimerRef.current)
			pauseTimerRef.current = null
		}
	}, [])

	useEffect(() => cancelPause, [cancelPause, roundKey])

	const submitText = useCallback(
		(value: string) => {
			cancelPause()
			if (enabled && value.trim()) {
				onAnswer(matcher.match([value], 'typing'))
			}
		},
		[cancelPause, enabled, matcher, onAnswer],
	)

	const change = useCallback(
		(value: string) => {
			if (!enabled) {
				return
			}
			setEntry({ roundKey, text: value })
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
		[acceptsEarly, cancelPause, enabled, matcher, roundKey, submitText],
	)

	const clear = useCallback(() => {
		cancelPause()
		setEntry({ roundKey, text: '' })
	}, [cancelPause, roundKey])

	return { text, change, clear, submit: () => submitText(text) }
}
