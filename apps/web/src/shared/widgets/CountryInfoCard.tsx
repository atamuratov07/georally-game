import type { CountryInfo } from '@georally/country-catalog'
import { useTranslation } from 'react-i18next'
import {
	getCountryCapital,
	getCountryCurrency,
	getCountryName,
	toFormattingLocale,
} from '../i18n'
import { useCurrentLocale } from '../../app/LocaleContext'

type CountryTagTone = 'independent' | 'unMember'

const TAG_CLASSES: Record<CountryTagTone, string> = {
	independent: 'bg-grass-100 text-grass-800',
	unMember: 'bg-ocean-100 text-ocean-800',
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className='flex items-baseline justify-between gap-3'>
			<dt className='text-[10px] font-extrabold tracking-[0.12em] text-muted uppercase'>
				{label}
			</dt>
			<dd className='text-right text-sm leading-snug font-black'>{value}</dd>
		</div>
	)
}

export function CountryInfoCard({ info }: { info: CountryInfo }) {
	const { t } = useTranslation()
	const language = useCurrentLocale()
	const displayName = getCountryName(info, language)
	const displayPopulation = info.population.toLocaleString(
		toFormattingLocale(language),
	)

	const tags: CountryTagTone[] = []
	if (info.independent) tags.push('independent')
	if (info.unMember) tags.push('unMember')

	return (
		<article className='w-68 animate-pop-in overflow-hidden rounded-3xl bg-white text-ink shadow-[0_0_0_2px_white,0_22px_48px_-10px_rgb(24_34_61/0.35)]'>
			<div className='relative aspect-[16/10] overflow-hidden bg-paper-deep'>
				<img
					src={info.flagUrl}
					alt={t('countryInfo.flagAlt', { country: displayName })}
					className='size-full object-cover'
				/>
				<div className='absolute inset-0 bg-[linear-gradient(180deg,rgb(24_34_61/0.05)_30%,rgb(24_34_61/0.8))]' />

				<span className='absolute top-2.5 left-2.5 rounded-full bg-ink/35 px-2.5 py-1 text-[10px] font-black tracking-[0.14em] text-white uppercase backdrop-blur-md'>
					{t(`countryInfo.continent.${info.continent}`)}
				</span>

				<div className='absolute inset-x-0 bottom-0 p-3.5'>
					<h2 className='text-xl leading-tight font-black text-white'>
						{displayName}
					</h2>
					<p className='text-sm font-bold text-white/85'>
						{getCountryCapital(info, language)}
					</p>
				</div>
			</div>

			<div className='flex flex-col gap-2 px-3.5 py-3'>
				{tags.length > 0 ? (
					<div className='flex flex-wrap gap-1.5 pb-1'>
						{tags.map(tag => (
							<span
								key={tag}
								className={`rounded-full px-2 py-0.5 text-[9px] font-black tracking-[0.14em] uppercase ${TAG_CLASSES[tag]}`}
							>
								{t(`countryInfo.tags.${tag}`)}
							</span>
						))}
					</div>
				) : null}
				<dl className='flex flex-col gap-1.5'>
					<InfoRow
						label={t('countryInfo.population')}
						value={displayPopulation}
					/>
					<InfoRow
						label={t('countryInfo.currency')}
						value={getCountryCurrency(info, language)}
					/>
				</dl>
			</div>
		</article>
	)
}
