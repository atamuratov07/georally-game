import { useCallback, useState } from 'react'
import {
	speechSupported,
	type SpeechNotice,
	type SpeechProblem,
} from './speechRecognition'

export function useSpeechStatus(lang: string | null) {
	const [denied, setDenied] = useState(false)
	const [unsupported, setUnsupported] = useState<ReadonlySet<string>>(
		() => new Set(),
	)
	const [notice, setNotice] = useState<SpeechNotice | null>(null)

	const report = useCallback(
		(problem: SpeechProblem) => {
			if (problem === 'denied') {
				setDenied(true)
				return
			}
			if (problem === 'unavailable' && lang) {
				setUnsupported(previous => new Set(previous).add(lang))
			}
			setNotice(problem)
		},
		[lang],
	)

	const clearNotice = useCallback(() => setNotice(null), [])

	return {
		available:
			speechSupported && lang !== null && !denied && !unsupported.has(lang),
		denied,
		notice,
		report,
		clearNotice,
	}
}
