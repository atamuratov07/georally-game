import { Play } from 'lucide-react'
import type { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Button, Card, CardHeader, CopyButton } from '@/shared/ui'
import { SINGLEPLAYER_MODES } from '../../modes'
import type { SingleplayerModeId } from '../../paths'
import { MODE_TONES } from './modeTones'

interface SetupCardProps {
	mode: SingleplayerModeId
	copyLink: string
	canStart?: boolean
	eligibleCount?: number
	best?: number | null
	onStart: () => void
	onPrefetch: () => void
	note?: ReactNode
	children: ReactNode
}

export function SetupCard({
	mode,
	copyLink,
	canStart = true,
	eligibleCount = 0,
	best = null,
	onStart,
	onPrefetch,
	note,
	children,
}: SetupCardProps) {
	const { t } = useTranslation()
	const entry = SINGLEPLAYER_MODES.find(item => item.id === mode)

	return (
		<Card>
			<CardHeader className='gap-3'>
				<div className='flex items-start justify-between gap-4'>
					{entry ? (
						<h1 className='text-lg leading-snug font-extrabold text-balance text-ink sm:text-2xl'>
							<span className='sr-only'>{t(entry.titleKey)}: </span>
							<Trans
								i18nKey={entry.descriptionKey}
								components={{
									hl: <span className={MODE_TONES[entry.tone].text} />,
								}}
							/>
						</h1>
					) : null}
					<CopyButton
						size='sm'
						className='shrink-0'
						textToCopy={copyLink}
						aria-label={t('singleplayer.copySetupLabel')}
					/>
				</div>
				{note ? (
					<p className='text-base font-medium text-muted'>{note}</p>
				) : null}
			</CardHeader>

			<div className='flex flex-col gap-6'>{children}</div>

			{best === null ? null : (
				<p className='mt-7 -mb-4 text-center text-sm font-extrabold text-muted tabular-nums'>
					{t('singleplayer.best.setup', { value: best })}
				</p>
			)}
			<Button
				type='button'
				size='lg'
				className='mt-8 w-full'
				disabled={!canStart}
				onMouseEnter={onPrefetch}
				onFocus={onPrefetch}
				onClick={onStart}
			>
				<Play aria-hidden='true' fill='currentColor' />
				{t('singleplayer.start')}
			</Button>
			{canStart ? null : (
				<p
					role='status'
					className='mt-3 text-center text-sm font-bold text-coral-600'
				>
					{t('singleplayer.notEnoughCountries', { count: eligibleCount })}
				</p>
			)}
		</Card>
	)
}
