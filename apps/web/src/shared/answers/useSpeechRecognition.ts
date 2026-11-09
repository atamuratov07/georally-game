import { useCallback, useEffect, useRef, useState } from 'react'

interface RecognitionAlternative {
	transcript: string
}

interface RecognitionResult {
	readonly isFinal: boolean
	readonly length: number
	[index: number]: RecognitionAlternative
}

interface RecognitionResultEvent {
	readonly resultIndex: number
	readonly results: {
		readonly length: number
		[index: number]: RecognitionResult
	}
}

interface Recognition {
	lang: string
	continuous: boolean
	interimResults: boolean
	maxAlternatives: number
	onresult: ((event: RecognitionResultEvent) => void) | null
	onerror: ((event: { error: string }) => void) | null
	onend: (() => void) | null
	start: () => void
	stop: () => void
	abort: () => void
}

type RecognitionConstructor = new () => Recognition

const DENIED_ERRORS = new Set(['not-allowed', 'audio-capture'])
const UNAVAILABLE_ERRORS = new Set([
	'service-not-allowed',
	'language-not-supported',
])
const IOS_NON_SAFARI = /CriOS|FxiOS|EdgiOS|OPiOS/

export type SpeechNotice = 'noSpeech' | 'network' | 'unavailable'

function findRecognition(): RecognitionConstructor | null {
	if (
		typeof window === 'undefined' ||
		IOS_NON_SAFARI.test(window.navigator.userAgent)
	) {
		return null
	}

	const speechWindow = window as unknown as {
		SpeechRecognition?: RecognitionConstructor
		webkitSpeechRecognition?: RecognitionConstructor
	}
	return (
		speechWindow.SpeechRecognition ??
		speechWindow.webkitSpeechRecognition ??
		null
	)
}

const RecognitionClass = findRecognition()

interface SpeechRecognitionOptions {
	lang: string | null
	onInterim?: (text: string) => void
	onFinal: (alternatives: string[]) => void
}

export function useSpeechRecognition({
	lang,
	onInterim,
	onFinal,
}: SpeechRecognitionOptions) {
	const [listening, setListening] = useState(false)
	const [denied, setDenied] = useState(false)
	const [unsupported, setUnsupported] = useState<ReadonlySet<string>>(
		() => new Set(),
	)
	const [notice, setNotice] = useState<SpeechNotice | null>(null)
	const [interim, setInterim] = useState('')
	const recognitionRef = useRef<Recognition | null>(null)
	const onFinalRef = useRef(onFinal)
	const onInterimRef = useRef(onInterim)

	useEffect(() => {
		onFinalRef.current = onFinal
		onInterimRef.current = onInterim
	})

	useEffect(() => () => recognitionRef.current?.abort(), [])

	const stop = useCallback(() => {
		recognitionRef.current?.stop()
	}, [])

	const abort = useCallback(() => {
		recognitionRef.current?.abort()
	}, [])

	const start = useCallback(() => {
		if (!RecognitionClass || !lang || recognitionRef.current) {
			return
		}

		const recognition = new RecognitionClass()
		const end = () => {
			if (recognitionRef.current !== recognition) {
				return
			}
			recognitionRef.current = null
			setInterim('')
			setListening(false)
		}
		recognition.lang = lang
		recognition.continuous = false
		recognition.interimResults = true
		recognition.maxAlternatives = 3

		recognition.onresult = event => {
			for (
				let index = event.resultIndex;
				index < event.results.length;
				index++
			) {
				const result = event.results[index]
				if (!result.isFinal) {
					const transcript = result[0]?.transcript ?? ''
					setInterim(transcript)
					onInterimRef.current?.(transcript)
					continue
				}

				const alternatives = Array.from(
					{ length: result.length },
					(_, alternative) => result[alternative].transcript,
				)
				setInterim('')
				onFinalRef.current(alternatives)
				recognition.stop()
			}
		}
		recognition.onerror = event => {
			if (DENIED_ERRORS.has(event.error)) {
				setDenied(true)
			} else if (event.error === 'no-speech') {
				setNotice('noSpeech')
			} else if (event.error === 'network') {
				setNotice('network')
			} else if (UNAVAILABLE_ERRORS.has(event.error)) {
				setUnsupported(previous => new Set(previous).add(lang))
				setNotice('unavailable')
			}
			end()
		}
		recognition.onend = end
		recognitionRef.current = recognition
		setListening(true)
		setNotice(null)
		try {
			recognition.start()
		} catch {
			end()
		}
	}, [lang])

	return {
		available:
			RecognitionClass !== null &&
			lang !== null &&
			!denied &&
			!unsupported.has(lang),
		denied,
		notice,
		listening,
		interim,
		start,
		stop,
		abort,
	}
}
