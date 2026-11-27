import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useRequestReaction } from '@/shared/feedback'
import { Button } from '@/shared/ui'

export function NextPuzzleButton({ onNext }: { onNext: () => void }) {
	const { t } = useTranslation()
	const requestReaction = useRequestReaction()
	const ref = useRef<HTMLButtonElement>(null)

	useEffect(() => {
		ref.current?.focus({ preventScroll: true })
	}, [])

	return (
		<Button
			ref={ref}
			type='button'
			size='lg'
			onClick={() => {
				requestReaction('routes')
				onNext()
			}}
		>
			{t('routes.result.next')}
		</Button>
	)
}
