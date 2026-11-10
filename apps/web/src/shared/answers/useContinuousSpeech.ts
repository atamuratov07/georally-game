import { useCallback, useEffect, useRef, useState } from 'react'
import {
	classifySpeechError,
	createRecognition,
	readAlternatives,
	type Recognition,
} from './speechRecognition'
import { useSpeechStatus } from './useSpeechStatus'

const QUICK_SESSION_MS = 1000
const RETRY_DELAYS_MS = [250, 1000, 2000]

interface ContinuousSpeechOptions {
	lang: string | null
	onFinal: (alternatives: string[]) => void
}

export function useContinuousSpeech({
	lang,
	onFinal,
}: ContinuousSpeechOptions) {
	const { available, denied, notice, report, clearNotice } =
		useSpeechStatus(lang)
	const [listening, setListening] = useState(false)
	const [interim, setInterim] = useState('')
	const wantedRef = useRef(false)
	const sessionRef = useRef<Recognition | null>(null)
	const failuresRef = useRef(0)
	const networkFailedRef = useRef(false)
	const retryTimerRef = useRef<number | null>(null)
	const onFinalRef = useRef(onFinal)

	useEffect(() => {
		onFinalRef.current = onFinal
	})

	const clearRetry = useCallback(() => {
		if (retryTimerRef.current !== null) {
			clearTimeout(retryTimerRef.current)
			retryTimerRef.current = null
		}
	}, [])

	const turnOff = useCallback(() => {
		wantedRef.current = false
		clearRetry()
		setListening(false)
	}, [clearRetry])

	const openSessionRef = useRef<(byTap: boolean) => void>(() => {})

	const openSession = useCallback(
		(byTap: boolean) => {
			if (
				!lang ||
				!wantedRef.current ||
				sessionRef.current ||
				document.hidden
			) {
				return
			}
			const recognition = createRecognition(lang, true)
			if (!recognition) {
				return
			}

			const openedAt = Date.now()
			const emitted = new Set<number>()
			let heardAnything = false

			const afterEnd = () => {
				if (sessionRef.current !== recognition) {
					return
				}
				sessionRef.current = null
				setInterim('')
				if (!wantedRef.current || document.hidden) {
					return
				}

				const quick =
					!heardAnything && Date.now() - openedAt < QUICK_SESSION_MS
				failuresRef.current = quick ? failuresRef.current + 1 : 0
				if (failuresRef.current > RETRY_DELAYS_MS.length) {
					report(networkFailedRef.current ? 'network' : 'paused')
					turnOff()
					return
				}
				const delay = quick ? RETRY_DELAYS_MS[failuresRef.current - 1] : 0
				retryTimerRef.current = window.setTimeout(() => {
					retryTimerRef.current = null
					openSessionRef.current(false)
				}, delay)
			}

			recognition.onresult = event => {
				heardAnything = true
				networkFailedRef.current = false
				let pending = ''
				for (
					let index = event.resultIndex;
					index < event.results.length;
					index++
				) {
					const result = event.results[index]
					if (!result.isFinal) {
						pending += result[0]?.transcript ?? ''
					} else if (!emitted.has(index)) {
						emitted.add(index)
						onFinalRef.current(readAlternatives(result))
					}
				}
				setInterim(pending.trim())
			}
			recognition.onerror = event => {
				const problem = classifySpeechError(event.error)
				if (problem === 'denied') {
					report(byTap ? 'denied' : 'paused')
					turnOff()
				} else if (problem === 'unavailable') {
					report(problem)
					turnOff()
				} else if (problem === 'network') {
					networkFailedRef.current = true
				}
			}
			recognition.onend = afterEnd
			sessionRef.current = recognition
			try {
				recognition.start()
			} catch {
				afterEnd()
			}
		},
		[lang, report, turnOff],
	)

	useEffect(() => {
		openSessionRef.current = openSession
	})

	const start = useCallback(() => {
		if (wantedRef.current || !available) {
			return
		}
		wantedRef.current = true
		failuresRef.current = 0
		networkFailedRef.current = false
		clearNotice()
		setListening(true)
		openSession(true)
	}, [available, clearNotice, openSession])

	const stop = useCallback(() => {
		turnOff()
		sessionRef.current?.stop()
	}, [turnOff])

	const abort = useCallback(() => {
		turnOff()
		sessionRef.current?.abort()
	}, [turnOff])

	useEffect(() => {
		const handleVisibility = () => {
			if (document.hidden) {
				sessionRef.current?.abort()
			} else {
				openSessionRef.current(false)
			}
		}
		document.addEventListener('visibilitychange', handleVisibility)
		return () =>
			document.removeEventListener('visibilitychange', handleVisibility)
	}, [])

	useEffect(
		() => () => {
			wantedRef.current = false
			clearRetry()
			sessionRef.current?.abort()
		},
		[clearRetry],
	)

	return {
		available,
		denied,
		notice,
		listening,
		interim,
		start,
		stop,
		abort,
	}
}
