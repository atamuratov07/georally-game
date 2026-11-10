import { useCallback, useEffect, useRef, useState } from 'react'
import {
	classifySpeechError,
	createRecognition,
	readAlternatives,
	type Recognition,
} from './speechRecognition'
import { useSpeechStatus } from './useSpeechStatus'

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
	const { available, denied, notice, report, clearNotice } =
		useSpeechStatus(lang)
	const [listening, setListening] = useState(false)
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
		if (!lang || recognitionRef.current) {
			return
		}
		const recognition = createRecognition(lang, false)
		if (!recognition) {
			return
		}

		const end = () => {
			if (recognitionRef.current !== recognition) {
				return
			}
			recognitionRef.current = null
			setInterim('')
			setListening(false)
		}

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

				setInterim('')
				onFinalRef.current(readAlternatives(result))
				recognition.stop()
			}
		}
		recognition.onerror = event => {
			const problem = classifySpeechError(event.error)
			if (problem) {
				report(problem)
			}
			end()
		}
		recognition.onend = end
		recognitionRef.current = recognition
		setListening(true)
		clearNotice()
		try {
			recognition.start()
		} catch {
			end()
		}
	}, [clearNotice, lang, report])

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
