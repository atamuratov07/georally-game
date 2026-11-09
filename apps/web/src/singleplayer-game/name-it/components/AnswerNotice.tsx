import { useTranslation } from 'react-i18next'
import type { SpeechNotice } from '@/shared/answers/useSpeechRecognition'

export function AnswerNotice({
	notice,
}: {
	notice: SpeechNotice | 'denied' | null
}) {
	const { t } = useTranslation()
	if (!notice) {
		return null
	}

	return (
		<p
			role='status'
			className='text-center text-xs font-bold text-white [text-shadow:0_1px_2px_rgb(24_34_61/0.6)]'
		>
			{t(`nameIt.mic.${notice}`)}
		</p>
	)
}
