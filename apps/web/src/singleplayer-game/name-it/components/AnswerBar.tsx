import type { InputMethod, MatchResult } from '@georally/game-domain/answers'
import type { Attempt } from '@georally/game-domain/singleplayer/name-it'
import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from '@/app/LocaleContext'
import { answerMatcher } from '@/shared/answers/matcher'
import { SPEECH_LANGUAGES } from '@/shared/answers/speechLanguage'
import { useSpeechRecognition } from '@/shared/answers/useSpeechRecognition'
import { useTypedAnswer } from '@/shared/answers/useTypedAnswer'
import { Input } from '@/shared/ui'
import { MicButton } from './MicButton'

const SHAKE: Keyframe[] = [
	{ transform: 'translateX(0)' },
	{ transform: 'translateX(-9px)' },
	{ transform: 'translateX(8px)' },
	{ transform: 'translateX(-5px)' },
	{ transform: 'translateX(3px)' },
	{ transform: 'translateX(0)' },
]

interface AnswerBarProps {
	targetId: string
	lastAttempt: Attempt | null
	speechLanguage: string | null
	onSpeechLanguageChange: (language: string) => void
	onAnswer: (method: InputMethod, result: MatchResult) => void
}

function hasFinePointer(): boolean {
	return window.matchMedia('(pointer: fine)').matches
}

function prefersReducedMotion(): boolean {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function AnswerBar({
	targetId,
	lastAttempt,
	speechLanguage,
	onSpeechLanguageChange,
	onAnswer,
}: AnswerBarProps) {
	const { t } = useTranslation()
	const locale = useCurrentLocale()
	const formRef = useRef<HTMLFormElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const typed = useTypedAnswer({
		matcher: answerMatcher,
		acceptsEarly: useCallback(
			(countryId: string) => countryId === targetId,
			[targetId],
		),
		onAnswer: useCallback(
			(result: MatchResult) => onAnswer('typing', result),
			[onAnswer],
		),
	})
	const acceptedEarlyRef = useRef(false)
	const speech = useSpeechRecognition({
		lang: speechLanguage,
		onInterim: useCallback(
			(text: string) => {
				const typedMatch = answerMatcher.matchAsTyped(text)
				if (
					acceptedEarlyRef.current ||
					typedMatch?.countryId !== targetId ||
					typedMatch.isPrefix
				) {
					return
				}
				acceptedEarlyRef.current = true
				onAnswer('voice', answerMatcher.match([text], 'voice'))
			},
			[onAnswer, targetId],
		),
		onFinal: useCallback(
			(alternatives: string[]) => {
				if (acceptedEarlyRef.current) {
					return
				}
				onAnswer('voice', answerMatcher.match(alternatives, 'voice'))
			},
			[onAnswer],
		),
	})

	useEffect(() => {
		if (hasFinePointer()) {
			inputRef.current?.focus({ preventScroll: true })
		}
	}, [])

	const lastAttemptAt = lastAttempt?.at
	const lastAttemptMethod = lastAttempt?.method
	useEffect(() => {
		if (lastAttemptAt === undefined) {
			return
		}
		if (lastAttemptMethod === 'typing') {
			inputRef.current?.select()
		}
		if (!prefersReducedMotion()) {
			formRef.current?.animate(SHAKE, { duration: 320, easing: 'ease-out' })
		}
	}, [lastAttemptAt, lastAttemptMethod])

	const otherLanguages = SPEECH_LANGUAGES.filter(
		code => code !== speechLanguage && speech.supportsLanguage(code),
	)
	const languageName = (code: string) =>
		new Intl.DisplayNames([locale], { type: 'language' }).of(
			code.split('-')[0],
		) ?? code

	const placeholder = speech.listening
		? speech.interim || t('nameIt.mic.listening')
		: t('nameIt.placeholder')

	const notice = speech.denied
		? t('nameIt.mic.denied')
		: speech.notice
			? t(`nameIt.mic.${speech.notice}`)
			: null

	return (
		<div className='flex flex-col gap-2'>
			<form
				ref={formRef}
				className='flex items-center gap-2 rounded-card border-2 border-line bg-white p-2 raised floating [--edge:var(--color-line-strong)]'
				onSubmit={event => {
					event.preventDefault()
					if (
						!typed.text.trim() &&
						speech.available &&
						!speech.listening
					) {
						speech.start()
						return
					}
					typed.submit()
				}}
			>
				<Input
					ref={inputRef}
					value={typed.text}
					onChange={event => typed.change(event.target.value)}
					placeholder={placeholder}
					aria-label={t('nameIt.inputLabel')}
					autoComplete='off'
					autoCorrect='off'
					autoCapitalize='off'
					spellCheck={false}
					enterKeyHint='go'
					className={speech.listening ? 'placeholder:text-ocean-600' : ''}
				/>
				{speech.available && speechLanguage ? (
					<>
						{otherLanguages.length > 0 ? (
							<button
								type='button'
								className='h-12 shrink-0 rounded-control px-2 text-sm font-black text-muted transition-colors hover:bg-paper-deep hover:text-ink'
								aria-label={t('nameIt.mic.language', {
									language: languageName(speechLanguage),
								})}
								title={t('nameIt.mic.language', {
									language: languageName(speechLanguage),
								})}
								onClick={() =>
									onSpeechLanguageChange(otherLanguages[0])
								}
							>
								{speechLanguage.slice(0, 2).toUpperCase()}
							</button>
						) : null}
						<MicButton
							listening={speech.listening}
							onPress={speech.listening ? speech.stop : speech.start}
						/>
					</>
				) : null}
			</form>
			{notice ? (
				<p
					role='status'
					className='text-center text-xs font-bold text-white [text-shadow:0_1px_2px_rgb(24_34_61/0.6)]'
				>
					{notice}
				</p>
			) : null}
		</div>
	)
}
