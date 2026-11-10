import { useEffect, type RefObject } from 'react'

export const ANSWER_FIELD_ATTRIBUTES = {
	autoComplete: 'off',
	autoCorrect: 'off',
	autoCapitalize: 'off',
	spellCheck: false,
	enterKeyHint: 'go',
} as const

export function useInitialFocus(ref: RefObject<HTMLInputElement | null>) {
	useEffect(() => {
		ref.current?.focus({ preventScroll: true })
	}, [ref])
}
