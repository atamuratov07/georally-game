import { useEffect, useRef, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
	ANSWER_FIELD_ATTRIBUTES,
	useInitialFocus,
} from '@/shared/answers/answerField'
import type { SprintInputState } from '../useSprintInput'

const SHAKE: Keyframe[] = [
	{ transform: 'translateX(0)' },
	{ transform: 'translateX(-9px)' },
	{ transform: 'translateX(8px)' },
	{ transform: 'translateX(-5px)' },
	{ transform: 'translateX(3px)' },
	{ transform: 'translateX(0)' },
]

export function useSprintField(input: SprintInputState) {
	const { t } = useTranslation()
	const formRef = useRef<HTMLFormElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const mistakeAt = input.mistake?.at

	useInitialFocus(inputRef)

	useEffect(() => {
		if (mistakeAt === undefined) {
			return
		}
		inputRef.current?.select()
		if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			formRef.current?.animate(SHAKE, { duration: 320, easing: 'ease-out' })
		}
	}, [mistakeAt])

	const onSubmit = (event: FormEvent) => {
		event.preventDefault()
		input.submit()
	}

	const fieldProps = {
		...ANSWER_FIELD_ATTRIBUTES,
		ref: inputRef,
		value: input.text,
		onChange: (event: { target: { value: string } }) =>
			input.change(event.target.value),
		placeholder: input.listening
			? input.interim || t('voice.listening')
			: t('recallSprint.placeholder'),
		'aria-label': t('recallSprint.inputLabel'),
	}

	return { formRef, onSubmit, fieldProps }
}
