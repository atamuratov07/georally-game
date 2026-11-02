import { Flag, LogOut } from 'lucide-react'
import { Button, ButtonLink } from '../../shared/ui'
import { QuestionTimer } from './QuestionTimer'
import { useTranslation } from 'react-i18next'

interface GameHeaderBarProps {
	questionIndex: number
	questionCount: number
	targetName: string
	targetFlagUrl?: string
	isPlaying: boolean
	questionStartedAt: number
	questionResolvedAt: number | null
	onGiveUp: () => void
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
}: GameHeaderBarProps) {
	const { t } = useTranslation()
	const progressLabel = questionCount
		? t('singleplayer.questionProgress', {
				current: Math.min(questionIndex + 1, questionCount),
				total: questionCount,
			})
		: t('common.noQuestions')

	return (
		<header className='flex justify-center border-b border-slate-500/35 bg-slate-950/88  text-white backdrop-blur-md'>
			<div className='relative w-full max-w-300 px-4 py-3'>
				<div className='absolute top-1.5 left-4'>
					<p className='text-[12px] font-semibold uppercase tracking-[0.05em] text-slate-300'>
						{progressLabel}
					</p>
				</div>
				<div className='mx-auto grid items-end gap-1 grid-cols-[auto_1fr_auto] sm:gap-4'>
					<ButtonLink
						to='/singleplayer'
						aria-label={t('singleplayer.exit')}
						variant='inverse'
						size='sm'
						className='min-h-10 px-3 text-slate-700 hover:text-slate-950 sm:px-3.5'
					>
						<LogOut
							className='shrink-0 rotate-180 sm:hidden'
							aria-hidden='true'
							size={20}
							strokeWidth={2}
						/>
						<span className='hidden sm:inline'>
							{t('singleplayer.exit')}
						</span>
					</ButtonLink>

					<div className='flex min-w-0 justify-center'>
						<div className='flex flex-col items-center justify-center gap-2 text-center'>
							<span className='text-sm font-semibold text-slate-300'>
								{t('singleplayer.find')}
							</span>
							<span className='flex flex-wrap items-center justify-center gap-2 text-xl font-bold leading-tight sm:text-2xl'>
								{targetName}
								{targetFlagUrl ? (
									<img
										src={targetFlagUrl}
										alt=''
										className='w-7 rounded-[3px] border border-slate-100/80 object-cover'
									/>
								) : null}
							</span>
						</div>
					</div>

					<Button
						type='button'
						aria-label={t('singleplayer.giveUp')}
						variant='none'
						size='sm'
						className='min-h-10 px-3 text-slate-50 bg-gray-700 hover:bg-gray-600 disabled:opacity-55 sm:px-3.5'
						onClick={onGiveUp}
						disabled={!isPlaying}
					>
						<Flag
							className='shrink-0 sm:hidden'
							aria-hidden='true'
							size={20}
							strokeWidth={2}
						/>
						<span className='hidden sm:inline'>
							{t('singleplayer.giveUp')}
						</span>
					</Button>
				</div>
				<div className='absolute top-1 right-4 text-sm font-bold'>
					<QuestionTimer
						isPlaying={isPlaying}
						questionStartedAt={questionStartedAt}
						questionResolvedAt={questionResolvedAt}
					/>
				</div>
			</div>
		</header>
	)
}
