import { useTranslation } from 'react-i18next'
import type { SpeechProblem } from '@/shared/answers/speechRecognition'

export function AnswerNotice({ notice }: { notice: SpeechProblem | null }) {
	const { t } = useTranslation()
	if (!notice) {
		return null
	}

	return (
		<p
			role='status'
			className='text-center text-xs font-bold text-white [text-shadow:0_1px_2px_rgb(24_34_61/0.6)]'
		>
			{t(`voice.${notice}`)}
		</p>
	)
}
