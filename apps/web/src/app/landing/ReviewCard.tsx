import { Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ReviewPlan } from '@/mastery/bridge/reviewPlan'
import { masteryPaths } from '@/mastery/paths'
import { cn } from '@/shared/utils'
import { LocalizedLink } from '../LocalizedLink'
import './today.css'

const BACK_CARD =
	'absolute inset-0 origin-bottom rounded-2xl transition-transform duration-300'

export function ReviewCard({ plan }: { plan: ReviewPlan | null }) {
	const { t } = useTranslation()
	const done = plan !== null && plan.review + plan.fresh === 0

	return (
		<LocalizedLink
			to={masteryPaths.home}
			className='group relative block h-full rounded-2xl outline-offset-4 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0.5'
		>
			{done ? null : (
				<>
					<span
						aria-hidden='true'
						className={cn(
							BACK_CARD,
							'rotate-[6deg] bg-lagoon-300 group-hover:translate-x-2 group-hover:rotate-[10deg]',
						)}
					/>
					<span
						aria-hidden='true'
						className={cn(
							BACK_CARD,
							'rotate-3 bg-lagoon-400 group-hover:translate-x-1 group-hover:rotate-[5deg]',
						)}
					/>
				</>
			)}
			<span className='review-ruled relative flex h-full flex-col overflow-hidden rounded-2xl [filter:drop-shadow(0_5px_0_var(--color-lagoon-600))_drop-shadow(0_14px_14px_rgb(24_34_61/0.18))]'>
				<span className='flex h-[var(--rule-top)] shrink-0 items-center justify-center text-xs font-extrabold tracking-wide text-lagoon-600 uppercase'>
					{t('review.title')}
				</span>
				<span className='flex flex-1 flex-col items-center justify-center gap-2 px-3 pt-2 pb-3 text-center'>
					{plan === null ? (
						<span className='text-base leading-snug font-extrabold text-balance text-ink sm:text-lg'>
							{t('landing.today.reviewInvite')}
						</span>
					) : done ? (
						<span className='text-xl leading-tight font-black text-ink sm:text-2xl'>
							{t('review.doneToday')}
						</span>
					) : (
						<span className='flex items-start justify-center gap-4 sm:gap-6'>
							{plan.review > 0 ? (
								<Count
									value={plan.review}
									label={t('review.toReview', { count: plan.review })}
									className='text-ink'
								/>
							) : null}
							{plan.fresh > 0 ? (
								<Count
									value={plan.fresh}
									label={t('review.newCards', { count: plan.fresh })}
									className='text-berry-500'
								/>
							) : null}
						</span>
					)}
				</span>
				{done ? null : (
					<span className='flex min-h-[4.25rem] items-center justify-center gap-2 border-t-2 border-dashed border-white/35 bg-lagoon-500 px-3 py-3 text-lg font-black text-white'>
						<Play
							aria-hidden='true'
							fill='currentColor'
							className='size-5 text-sunflower-300 transition-transform group-hover:translate-x-0.5'
						/>
						{t('review.start')}
					</span>
				)}
			</span>
		</LocalizedLink>
	)
}

function Count({
	value,
	label,
	className,
}: {
	value: number
	label: string
	className: string
}) {
	return (
		<span className='flex flex-col items-center'>
			<span
				className={cn(
					'text-[2.75rem] leading-none font-black tracking-tight tabular-nums',
					className,
				)}
			>
				{value}
			</span>
			<span className='text-xs font-extrabold text-ink/60'>{label}</span>
		</span>
	)
}
