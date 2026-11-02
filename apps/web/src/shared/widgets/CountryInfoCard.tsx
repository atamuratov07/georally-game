import type { CountryInfo } from '@georally/country-catalog'
import { useTranslation } from 'react-i18next'
import {
	getCountryCapital,
	getCountryCurrency,
	getCountryName,
	toFormattingLocale,
} from '../i18n'
import { useCurrentLocale } from '../../app/LocaleContext'

function textOrUnknown(value: string, unknownLabel: string): string {
	const normalized = value.trim()
	return normalized ? normalized : unknownLabel
}

function populationLabel(
	value: number,
	locale: string,
	unknownLabel: string,
): string {
	if (!Number.isFinite(value) || value <= 0) {
		return unknownLabel
	}

	return value.toLocaleString(locale)
}

type CountryTagTone = 'independent' | 'unMember'

const TAG_STYLES: Record<CountryTagTone, { className: string }> = {
	independent: {
		className: 'border-emerald-200 bg-emerald-50/90 text-emerald-800',
	},
	unMember: {
		className: 'border-sky-200 bg-sky-50/90 text-sky-800',
	},
}

function Tag({
	label,
	tone,
}: {
	label: string
	tone: CountryTagTone
}) {
	const styles = TAG_STYLES[tone]

	return (
		<span
			className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] ${styles?.className ?? 'border-slate-200 bg-slate-100 text-slate-700'}`}
		>
			{label}
		</span>
	)
}

function InfoRow({
	label,
	value,
}: {
	label: string
	value: string
}) {
	return (
		<div className='flex items-baseline justify-between gap-3'>
			<p className='text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500'>
				{label}
			</p>
			<p className='text-right text-sm font-black leading-snug text-slate-950'>
				{value}
			</p>
		</div>
	)
}

export function CountryInfoCard({ info }: { info: CountryInfo }) {
	const { t } = useTranslation()
	const language = useCurrentLocale()
	const unknownLabel = t('common.unknown')

	const displayName = textOrUnknown(
		getCountryName(info, language),
		unknownLabel,
	)
	const displayCapital = textOrUnknown(
		getCountryCapital(info, language),
		unknownLabel,
	)
	const displayCurrency = textOrUnknown(
		getCountryCurrency(info, language),
		unknownLabel,
	)
	const displayPopulation = populationLabel(
		info.population,
		toFormattingLocale(language),
		unknownLabel,
	)

	const continentLabel = t(`countryInfo.continent.${info.continent}`)

	const tags = [
		info.independent
			? {
					tone: 'independent',
					label: t('countryInfo.tags.independent'),
				}
			: null,
		info.unMember
			? {
					tone: 'unMember',
					label: t('countryInfo.tags.unMember'),
				}
			: null,
	].filter(
		(value): value is { tone: CountryTagTone; label: string } =>
			value !== null,
	)

	return (
		<article className='w-70 overflow-hidden rounded-3xl bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.96))] text-slate-950 shadow-[0_22px_48px_rgba(15,23,42,0.16)] backdrop-blur'>
			<div className='relative h-auto overflow-hidden bg-slate-300'>
				{info.flagUrl ? (
					<img
						src={info.flagUrl}
						alt={t('countryInfo.flagAlt', { country: displayName })}
						className='h-full w-full object-contain'
					/>
				) : (
					<div className='h-full w-full bg-slate-200' />
				)}
				<div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12),rgba(15,23,42,0.74))]' />

				<div className='absolute inset-x-0 top-0 flex justify-start p-3'>
					<span className='rounded-full bg-white/16 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-md'>
						{continentLabel}
					</span>
				</div>

				<div className='absolute inset-x-0 bottom-0 p-3.5'>
					<h2 className='text-xl font-black leading-tight text-white'>
						{displayName}
					</h2>
					<p className='mt-1 text-sm font-semibold text-white/88'>
						{displayCapital}
					</p>
				</div>
			</div>

			<div className='space-y-2.5 px-3.5 py-3'>
				{tags.length > 0 ? (
					<div className='flex flex-wrap gap-1.5 pb-2'>
						{tags.map(tag => (
							<Tag key={tag.tone} tone={tag.tone} label={tag.label} />
						))}
					</div>
				) : null}
				<InfoRow
					label={t('countryInfo.population')}
					value={displayPopulation}
				/>
				<InfoRow
					label={t('countryInfo.currency')}
					value={displayCurrency}
				/>
			</div>
		</article>
	)
}
