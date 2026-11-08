import { LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { Button } from '@/shared/ui'
import { GameHud, TimerChip } from '@/shared/widgets/GameHud'
import { singleplayerPaths } from '../../paths'

interface GameHeaderProps {
	questionIndex: number
	questionCount: number
	targetName: string
	targetFlagUrl?: string
	isAnswering: boolean
	startedAt: number | null
	resolvedAt: number | null
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
	questionIndex,
	questionCount,
	targetName,
	targetFlagUrl,
	isAnswering,
	startedAt,
	resolvedAt,
}: GameHeaderProps) {
	const { t } = useTranslation()
	const elapsed = useElapsedSeconds(isAnswering, startedAt, resolvedAt)

	return (
		<GameHud
			current={Math.min(questionIndex + 1, questionCount)}
			total={questionCount}
			completed={Math.min(
				questionIndex + (isAnswering ? 0 : 1),
				questionCount,
			)}
			targetName={targetName}
			targetFlagUrl={targetFlagUrl}
			start={
				<Button
					asChild
					variant='ghost'
					size='icon'
					className='text-white/70 hover:bg-white/10 hover:text-white'
					aria-label={t('singleplayer.exit')}
					title={t('singleplayer.exit')}
				>
					<LocalizedLink to={singleplayerPaths('locate').setup}>
						<LogOut aria-hidden='true' className='rotate-180' />
					</LocalizedLink>
				</Button>
			}
			end={<TimerChip seconds={elapsed} label={t('game.elapsed')} />}
		/>
	)
}
