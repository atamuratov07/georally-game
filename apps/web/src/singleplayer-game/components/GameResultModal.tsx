import { useTranslation } from 'react-i18next'
import { Button, SurfacePanel } from '../../shared/ui'

interface GameResultModalProps {
	open: boolean
	score: number
	correctCount: number
	totalCount: number
	onTryAgain: () => void
	onHome: () => void
}

export function GameResultModal({
	open,
	score,
	correctCount,
	totalCount,
	onTryAgain,
	onHome,
}: GameResultModalProps) {
	const { t } = useTranslation()

	if (!open) {
		return null
	}

	return (
		<div
			className='fixed inset-0 z-40 grid place-items-center bg-slate-900/45 p-5'
			role='dialog'
			aria-modal='true'
		>
			<SurfacePanel
				width='none'
				className='max-w-105 rounded-[20px] bg-white text-center shadow-[0_24px_54px_rgba(15,23,42,0.24)]'
			>
				<h2 className='m-0 text-2xl font-bold text-slate-900'>
					{t('singleplayer.sessionComplete')}
				</h2>

				<div className='my-4'>
					<p className='m-0 text-[40px] leading-none font-extrabold text-slate-900'>
						{score}
					</p>
					<p className='mt-1 text-sm text-slate-700'>
						{t('singleplayer.correctAnswers', {
							correct: correctCount,
							total: totalCount,
						})}
					</p>
				</div>

				<div className='flex flex-wrap justify-center gap-2.5'>
					<Button
						type='button'
						variant='teal'
						is3d
						size='sm'
						className='hover:-translate-y-0.5'
						onClick={onTryAgain}
					>
						{t('singleplayer.playAgain')}
					</Button>
					<Button
						type='button'
						variant='soft'
						is3d
						size='sm'
						className='hover:-translate-y-0.5'
						onClick={onHome}
					>
						{t('common.home')}
					</Button>
				</div>
			</SurfacePanel>
		</div>
	)
}
