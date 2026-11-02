import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useAppLanguage } from './useAppLanguage'

export function I18nDocumentSync({ children }: { children: ReactNode }) {
	const language = useAppLanguage()

	useEffect(() => {
		document.documentElement.lang = language
		document.documentElement.dir = 'ltr'
	}, [language])

	return <>{children}</>
}
