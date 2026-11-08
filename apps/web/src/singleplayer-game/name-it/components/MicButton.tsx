import { Mic, Square } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui'

interface MicButtonProps {
	listening: boolean
	onPress: () => void
}

export function MicButton({ listening, onPress }: MicButtonProps) {
	const { t } = useTranslation()
	const label = listening ? t('nameIt.mic.stop') : t('nameIt.mic.start')

	return (
		<span className='relative shrink-0'>
			{listening ? (
				<span
					aria-hidden='true'
					className='absolute inset-0 animate-ping rounded-control bg-coral-400/60'
				/>
			) : null}
			<Button
				type='button'
				size='icon'
				variant={listening ? 'coral' : 'ocean'}
				aria-label={label}
				aria-pressed={listening}
				title={label}
				className='relative size-12'
				onClick={onPress}
			>
				{listening ? (
					<Square
						aria-hidden='true'
						fill='currentColor'
						className='size-4'
					/>
				) : (
					<Mic aria-hidden='true' />
				)}
			</Button>
		</span>
	)
}
