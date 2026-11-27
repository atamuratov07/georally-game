import type { LocalDay } from '@georally/game-domain'
import { countDue, planCounts, type Today } from '@georally/mastery'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import { localDay } from '@/shared/time/localDay'
import { Button } from '@/shared/ui'
import { masteryPaths } from '../paths'
import { Stat } from '../shared/Stat'

export function TodayPanel({
	today: { cards, sessionPlan },
	day,
	children,
}: {
	today: Today
	day: LocalDay
	children: ReactNode
}) {
	const { t } = useTranslation()
	const navigate = useLocalizedNavigate()

	if (sessionPlan.length === 0) {
		const tomorrow = countDue(cards, localDay(day.end).end)
		return (
			<div className='flex flex-col items-center gap-1 text-center'>
				<p className='text-3xl font-black tracking-tight'>
					{t('review.doneToday')}
				</p>
				{tomorrow > 0 ? (
					<p className='text-base font-bold text-muted'>
						{t('review.tomorrow', { count: tomorrow })}
					</p>
				) : null}
			</div>
		)
	}

	const { review: reviewCount, fresh: newCount } = planCounts(
		cards,
		sessionPlan,
	)

	return (
		<div className='flex flex-col items-center gap-5'>
			<div className='flex justify-center gap-12'>
				{reviewCount > 0 ? (
					<Stat
						value={reviewCount}
						label={t('review.toReview', { count: reviewCount })}
					/>
				) : null}
				{newCount > 0 ? (
					<Stat
						value={newCount}
						label={t('review.newCards', { count: newCount })}
					/>
				) : null}
			</div>
			<div className='w-full'>{children}</div>
			<Button
				size='lg'
				className='w-full'
				onClick={() => navigate(masteryPaths.play)}
			>
				{t('review.start')}
			</Button>
		</div>
	)
}
