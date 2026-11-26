import { useTranslation } from 'react-i18next'
import { TimerChip } from '@/game-kit/hud/GameHud'
import { useCountdown } from './hooks/useCountdown'

const URGENT_COUNTDOWN_SECONDS = 5

export function Countdown({ deadlineAt }: { deadlineAt: number }) {
	const { t } = useTranslation()
	const secondsLeft = useCountdown(deadlineAt)

	return (
		<TimerChip
			seconds={secondsLeft}
			urgent={secondsLeft <= URGENT_COUNTDOWN_SECONDS}
			label={t('game.timeLeft')}
		/>
	)
}
