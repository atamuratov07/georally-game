import { Flag, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { Button } from '@/shared/ui'
import { GameHud, TimerChip } from '@/shared/widgets/GameHud'

interface GameHeaderProps {
	questionIndex: number
	questionCount: number
	targetName: string
	targetFlagUrl?: string
	isPlaying: boolean
	questionStartedAt: number
	questionResolvedAt: number | null
	onGiveUp: () => void
}

function useElapsedSeconds(
	isPlaying: boolean,
	startedAt: number,
	resolvedAt: number | null,
): number {
	const [now, setNow] = useState(() => Date.now())

	useEffect(() => {
		if (!isPlaying) return
		const intervalId = setInterval(() => setNow(Date.now()), 1000)
		return () => clearInterval(intervalId)
	}, [isPlaying, startedAt])

	if (startedAt <= 0) return 0
	const endTime = isPlaying ? now : (resolvedAt ?? now)
	return Math.max(0, Math.floor((endTime - startedAt) / 1000))
}

export function GameHeader({
	questionIndex,
	questionCount,
	targetName,
	targetFlagUrl,
	isPlaying,
	questionStartedAt,
	questionResolvedAt,
	onGiveUp,
}: GameHeaderProps) {
	const { t } = useTranslation()
	const elapsed = useElapsedSeconds(
		isPlaying,
		questionStartedAt,
		questionResolvedAt,
	)

	return (
		<GameHud
			current={Math.min(questionIndex + 1, questionCount)}
			total={questionCount}
			completed={Math.min(
				questionIndex + (isPlaying ? 0 : 1),
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
					<LocalizedLink to='/singleplayer'>
						<LogOut aria-hidden='true' className='rotate-180' />
					</LocalizedLink>
				</Button>
			}
			end={
				<>
					<span className='hidden sm:inline-flex'>
						<TimerChip seconds={elapsed} label={t('game.elapsed')} />
					</span>
					<Button
						type='button'
						variant='neutral'
						className='h-11 px-3 sm:px-4'
						aria-label={t('singleplayer.giveUp')}
						onClick={onGiveUp}
						disabled={!isPlaying}
					>
						<Flag aria-hidden='true' />
						<span className='hidden md:inline'>
							{t('singleplayer.giveUp')}
						</span>
					</Button>
				</>
			}
		/>
	)
}
