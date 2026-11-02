import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface QuestionTimerProps {
	isPlaying: boolean
	questionStartedAt: number
	questionResolvedAt: number | null
}

export function QuestionTimer({
	isPlaying,
	questionStartedAt,
	questionResolvedAt,
}: QuestionTimerProps) {
	const { t } = useTranslation()
	const [now, setNow] = useState(() => Date.now())

	useEffect(() => {
		if (!isPlaying) {
			return
		}

		const intervalId = setInterval(() => {
			setNow(Date.now())
		}, 1000)

		return () => {
			clearInterval(intervalId)
		}
	}, [isPlaying, questionStartedAt])

	const elapsedSeconds = useMemo(() => {
		if (questionStartedAt <= 0) {
			return 0
		}

		const endTime = isPlaying ? now : (questionResolvedAt ?? now)
		return Math.max(0, Math.floor((endTime - questionStartedAt) / 1000))
	}, [isPlaying, now, questionResolvedAt, questionStartedAt])

	return (
		<span>
			{t('singleplayer.elapsedTime', {
				seconds: elapsedSeconds,
			})}
		</span>
	)
}
