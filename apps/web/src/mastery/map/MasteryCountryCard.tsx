import type { CountryInfo } from '@georally/country-catalog'
import type { MasteryView } from '@georally/mastery'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from '@/app/LocaleContext'
import { getCountryName } from '@/shared/i18n'
import { localDay } from '@/shared/time/localDay'
import { FlagImage } from '@/shared/widgets/FlagImage'
import { MASTERY_FILL } from './masteryStyles'

const DAY_MS = 86_400_000
const CHIP =
	'rounded-full px-2.5 py-0.5 text-xs font-black whitespace-nowrap text-ink'

function daysUntil(due: number, now: number) {
	const days = (localDay(due).start - localDay(now).start) / DAY_MS
	return Math.max(0, Math.round(days))
}

function MasteryLine({ view, now }: { view: MasteryView; now: number }) {
	const { t } = useTranslation()
	const days = daysUntil(view.due, now)
	const due =
		days === 0
			? t('review.nextReview.today')
			: days === 1
				? t('review.nextReview.tomorrow')
				: t('review.nextReview.days', { count: days })

	return (
		<div className='flex flex-wrap items-center gap-1.5'>
			<span
				className={CHIP}
				style={{ backgroundColor: MASTERY_FILL[view.level] }}
			>
				{t(`review.level.${view.level}`)}
			</span>
			{view.fading ? (
				<span
					className={CHIP}
					style={{
						background: `repeating-linear-gradient(135deg, rgb(255 255 255 / 0.7) 0 3px, transparent 3px 7px), ${MASTERY_FILL[view.level]}`,
					}}
				>
					{t('review.fading')}
				</span>
			) : null}
			<span className='w-full text-xs font-extrabold text-muted'>{due}</span>
		</div>
	)
}

export function MasteryCountryCard({
	info,
	view,
	planned,
	now,
}: {
	info: CountryInfo
	view: MasteryView | undefined
	planned: boolean
	now: number
}) {
	const { t } = useTranslation()
	const language = useCurrentLocale()
	const name = getCountryName(info, language)

	return (
		<article className='w-52 animate-pop-in overflow-hidden rounded-3xl bg-white text-ink shadow-[0_0_0_2px_white,0_22px_48px_-10px_rgb(24_34_61/0.35)]'>
			<div className='relative aspect-[16/9] overflow-hidden bg-paper-deep'>
				<FlagImage
					src={info.flagUrl}
					alt=''
					className='size-full object-cover'
				/>
				<div className='absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgb(24_34_61/0.8))]' />
				<h2 className='absolute inset-x-0 bottom-0 p-3 text-lg leading-tight font-black text-white'>
					{name}
				</h2>
			</div>
			<div className='px-3 py-2.5'>
				{view ? (
					<MasteryLine view={view} now={now} />
				) : (
					<p className='text-xs font-extrabold text-muted'>
						{planned ? t('review.comingUp') : t('review.notInReview')}
					</p>
				)}
			</div>
		</article>
	)
}
