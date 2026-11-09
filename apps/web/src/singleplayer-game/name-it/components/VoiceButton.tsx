import { Mic } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui'

const SOUND_BAR_DELAYS = ['0ms', '240ms', '120ms', '360ms']

interface VoiceButtonProps {
	listening: boolean
	onPress: () => void
}

function SoundBars() {
	return (
		<span aria-hidden='true' className='flex h-7 items-center gap-1'>
			{SOUND_BAR_DELAYS.map(delay => (
				<span
					key={delay}
					className='h-full w-1.5 origin-center rounded-full bg-white motion-safe:animate-sound-bar'
					style={{ animationDelay: delay }}
				/>
			))}
		</span>
	)
}

export function VoiceButton({ listening, onPress }: VoiceButtonProps) {
	const { t } = useTranslation()
	const label = listening ? t('nameIt.mic.stop') : t('nameIt.mic.start')

	return (
		<span className='relative grid size-16 animate-pop-in place-items-center'>
			<Button
				type='button'
				size='icon'
				variant={listening ? 'coral' : 'grape'}
				className="relative size-16 [&_svg:not([class*='size-'])]:size-7"
				aria-label={label}
				aria-pressed={listening}
				title={label}
				onClick={onPress}
			>
				{listening ? <SoundBars /> : <Mic aria-hidden='true' />}
			</Button>
		</span>
	)
}
