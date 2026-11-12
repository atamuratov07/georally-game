import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GameHud, TimerChip } from '@/shared/widgets/GameHud'
import { cn } from '@/shared/utils'
import { LeaveButton } from '../../shared/components/LeaveButton'
import type { RoundInfo } from './RoundSplash'

const TRANSITION_CLASSES = {
	frame: 'vt-hud',
	full: 'vt-hud vt-hud-target',
} as const

interface GameHeaderProps {
	round: RoundInfo
	isAnswering: boolean
	startedAt: number | null
	resolvedAt: number | null
	hidden: boolean
	transitionParts?: keyof typeof TRANSITION_CLASSES
}

function useElapsedSeconds(
	isAnswering: boolean,
	startedAt: number | null,
	resolvedAt: number | null,
): number {
	const [now, setNow] = useState(() => Date.now())

	useEffect(() => {
		if (!isAnswering) return
		const intervalId = setInterval(() => setNow(Date.now()), 1000)
		return () => clearInterval(intervalId)
	}, [isAnswering, startedAt])

	if (startedAt === null) return 0
	const endTime = isAnswering ? now : (resolvedAt ?? now)
	return Math.max(0, Math.floor((endTime - startedAt) / 1000))
}

export function GameHeader({
	round,
	isAnswering,
	startedAt,
	resolvedAt,
	hidden,
	transitionParts,
}: GameHeaderProps) {
	const { t } = useTranslation()
	const elapsed = useElapsedSeconds(isAnswering, startedAt, resolvedAt)

	return (
		<GameHud
			className={cn(
				hidden && 'invisible',
				transitionParts && TRANSITION_CLASSES[transitionParts],
			)}
			current={round.current}
			total={round.total}
			completed={round.completed}
			targetName={round.name}
			targetFlagUrl={round.flagUrl}
			start={<LeaveButton mode='locate' tone='dark' />}
			end={<TimerChip seconds={elapsed} label={t('game.elapsed')} />}
		/>
	)
}
