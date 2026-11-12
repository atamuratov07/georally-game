import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils'

export interface RoundInfo {
	current: number
	total: number
	completed: number
	name: string
	flagUrl?: string
}

const ENTRANCE =
	'*:animate-pop-in [&>:nth-child(2)]:[animation-delay:60ms] [&>:nth-child(3)]:[animation-delay:110ms] [&>:nth-child(4)]:[animation-delay:150ms]'

export function RoundSplash({
	round,
	entrance = false,
}: {
	round: RoundInfo
	entrance?: boolean
}) {
	const { t } = useTranslation()

	return (
		<div
			className={cn(
				'absolute inset-x-0 bottom-[calc(50%+2.5rem)] flex flex-col items-center gap-3.5 px-4 text-center',
				entrance && ENTRANCE,
			)}
		>
			<p
				className='flex items-baseline justify-center gap-2 leading-tight font-extrabold text-white/60'
				aria-label={t('game.progress', {
					current: round.current,
					total: round.total,
				})}
			>
				<span data-hud-part='count' className='text-[15px] tabular-nums'>
					{round.current}/{round.total}
				</span>
			</p>

			{round.flagUrl ? (
				<img
					data-hud-part='flag'
					src={round.flagUrl}
					alt=''
					className='aspect-[auto_3/2] h-[clamp(60px,15vw,92px)] w-auto rounded-lg shadow-[0_0_0_4px_rgb(255_255_255/0.9),0_10px_0_4px_rgb(255_255_255/0.18)]'
				/>
			) : null}

			<p
				data-hud-part='verb'
				className='mt-1 -mb-2 text-lg font-extrabold text-sunflower-400'
			>
				{t('game.find')}
			</p>

			<h2 className='max-w-full text-[clamp(2.5rem,11vw,4.75rem)] leading-tight font-black tracking-tight'>
				<span
					data-hud-part='name'
					className='text-fit inline-block max-w-full truncate align-top [--fit-width:calc(100vw_-_2rem)]'
					style={{ '--chars': round.name.length } as CSSProperties}
				>
					{round.name}
				</span>
			</h2>
		</div>
	)
}
