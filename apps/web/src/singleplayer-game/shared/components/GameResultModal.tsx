import { animate } from 'motion'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SingleplayerModeParam } from '@/shared/analytics/track'
import { GameReaction } from '@/shared/feedback'
import { celebrate } from '@/shared/lib/confetti'
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	TextButton,
} from '@/shared/ui'

interface GameResultModalProps {
	open: boolean
	mode: SingleplayerModeParam
	score: number
	correctCount: number
	totalCount: number
	onTryAgain: () => void
	onHome: () => void
}

function CountUp({ value }: { value: number }) {
	const [display, setDisplay] = useState(0)

	useEffect(() => {
		const controls = animate(0, value, {
			duration: 0.9,
			delay: 0.25,
			ease: [0.22, 1, 0.36, 1],
			onUpdate: latest => setDisplay(Math.round(latest)),
		})
		return () => controls.stop()
	}, [value])

	return <>{display}</>
}

export function GameResultModal({
	open,
	mode,
	score,
	correctCount,
	totalCount,
	onTryAgain,
	onHome,
}: GameResultModalProps) {
	const { t } = useTranslation()

	useEffect(() => {
		if (open) celebrate()
	}, [open])

	return (
		<Dialog open={open}>
			<DialogContent
				className='text-center'
				onEscapeKeyDown={event => event.preventDefault()}
				onInteractOutside={event => event.preventDefault()}
			>
				<DialogTitle>{t('singleplayer.resultTitle')}</DialogTitle>
				<DialogDescription className='sr-only'>
					{t('game.correctCount', { count: correctCount })}
				</DialogDescription>

				<div className='flex divide-x-2 divide-line'>
					<div className='flex flex-1 flex-col items-center'>
						<span className='text-5xl font-black text-ocean-600 tabular-nums'>
							<CountUp value={score} />
						</span>
						<span className='text-sm font-bold text-muted'>
							{t('game.score')}
						</span>
					</div>
					<div className='flex flex-1 flex-col items-center'>
						<span className='text-5xl font-black tabular-nums'>
							{correctCount}
							<span className='text-3xl text-muted'>/{totalCount}</span>
						</span>
						<span className='text-sm font-bold text-muted'>
							{t('game.correct')}
						</span>
					</div>
				</div>

				<div className='flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-center sm:gap-5'>
					<TextButton type='button' onClick={onHome}>
						{t('common.home')}
					</TextButton>
					<Button
						type='button'
						className='w-full sm:w-auto sm:px-8'
						autoFocus
						onClick={onTryAgain}
					>
						{t('singleplayer.playAgain')}
					</Button>
				</div>

				<GameReaction mode={mode} className='mt-1' />
			</DialogContent>
		</Dialog>
	)
}
