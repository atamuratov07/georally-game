interface RecognitionAlternative {
	transcript: string
}

export interface RecognitionResult {
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

export interface Recognition {
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

export type SpeechNotice = 'noSpeech' | 'network' | 'unavailable' | 'paused'
export type SpeechProblem = 'denied' | SpeechNotice

const DENIED_ERRORS = new Set(['not-allowed', 'audio-capture'])
const UNAVAILABLE_ERRORS = new Set([
	'service-not-allowed',
	'language-not-supported',
])
const IOS_NON_SAFARI = /CriOS|FxiOS|EdgiOS|OPiOS/

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

export const speechSupported = RecognitionClass !== null

export function createRecognition(
	lang: string,
	continuous: boolean,
): Recognition | null {
	if (!RecognitionClass) {
		return null
	}

	const recognition = new RecognitionClass()
	recognition.lang = lang
	recognition.continuous = continuous
	recognition.interimResults = true
	recognition.maxAlternatives = 3
	return recognition
}

export function readAlternatives(result: RecognitionResult): string[] {
	return Array.from(
		{ length: result.length },
		(_, index) => result[index].transcript,
	)
}

export function classifySpeechError(error: string): SpeechProblem | null {
	if (DENIED_ERRORS.has(error)) {
		return 'denied'
	}
	if (UNAVAILABLE_ERRORS.has(error)) {
		return 'unavailable'
	}
	if (error === 'no-speech') {
		return 'noSpeech'
	}
	if (error === 'network') {
		return 'network'
	}
	return null
}
