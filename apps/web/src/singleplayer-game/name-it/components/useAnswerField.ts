import type { Attempt } from '@georally/game-domain/singleplayer/name-it'
import { useEffect, useRef, type FormEvent, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnswerStage, RevealedAnswer } from '../roundControls'
import type { AnswerInputState } from '../useAnswerInput'

const SHAKE: Keyframe[] = [
	{ transform: 'translateX(0)' },
	{ transform: 'translateX(-9px)' },
	{ transform: 'translateX(8px)' },
	{ transform: 'translateX(-5px)' },
	{ transform: 'translateX(3px)' },
	{ transform: 'translateX(0)' },
]

export interface AnswerFieldOptions {
	stage: AnswerStage
	answer: RevealedAnswer | null
	lastAttempt: Attempt | null
	input: AnswerInputState
	onNext: () => void
}

function useWrongAnswerFeedback(
	lastAttempt: Attempt | null,
	formRef: RefObject<HTMLFormElement | null>,
	inputRef: RefObject<HTMLInputElement | null>,
) {
	const at = lastAttempt?.at
	const method = lastAttempt?.method

	useEffect(() => {
		if (at === undefined) {
			return
		}
		if (method === 'typing') {
			inputRef.current?.select()
		}
		if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			formRef.current?.animate(SHAKE, { duration: 320, easing: 'ease-out' })
		}
	}, [at, formRef, inputRef, method])
}

export function useAnswerField({
	stage,
	answer,
	lastAttempt,
	input,
	onNext,
}: AnswerFieldOptions) {
	const { t } = useTranslation()
	const formRef = useRef<HTMLFormElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const reveal = stage === 'revealed' ? answer : null
	const feedback =
		stage === 'answering' &&
		lastAttempt &&
		(input.attemptStartedAt === null ||
			lastAttempt.at >= input.attemptStartedAt)
			? lastAttempt
			: null

	useEffect(() => {
		inputRef.current?.focus({ preventScroll: true })
	}, [])
	useWrongAnswerFeedback(lastAttempt, formRef, inputRef)

	const onSubmit = (event: FormEvent) => {
		event.preventDefault()
		if (reveal) {
			onNext()
		} else if (stage === 'answering') {
			input.submit()
		}
	}

	const fieldProps = {
		ref: inputRef,
		value: reveal ? reveal.name : input.text,
		onChange: (event: { target: { value: string } }) =>
			input.change(event.target.value),
		placeholder:
			stage === 'waiting'
				? t('nameIt.waiting')
				: input.listening
					? input.interim || t('nameIt.mic.listening')
					: t('nameIt.placeholder'),
		'aria-label': t('nameIt.inputLabel'),
		'aria-readonly': stage !== 'answering',
		autoComplete: 'off',
		autoCorrect: 'off',
		autoCapitalize: 'off',
		spellCheck: false,
		enterKeyHint: 'go' as const,
	}

	return { formRef, reveal, feedback, onSubmit, fieldProps }
}
