import { Play } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Button,
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
	CopyButton,
} from '@/shared/ui'
import { SINGLEPLAYER_MODES } from '../../modes'
import type { SingleplayerModeId } from '../../paths'

interface SetupCardProps {
	mode: SingleplayerModeId
	copyLink: string
	canStart: boolean
	eligibleCount: number
	onStart: () => void
	onPrefetch: () => void
	children: ReactNode
}

export function SetupCard({
	mode,
	copyLink,
	canStart,
	eligibleCount,
	onStart,
	onPrefetch,
	children,
}: SetupCardProps) {
	const { t } = useTranslation()
	const descriptionKey = SINGLEPLAYER_MODES.find(
		entry => entry.id === mode,
	)?.descriptionKey

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center justify-between gap-3'>
					<CardTitle asChild>
						<h1>{t('singleplayer.title')}</h1>
					</CardTitle>
					<CopyButton
						size='sm'
						className='shrink-0'
						textToCopy={copyLink}
						aria-label={t('singleplayer.copySetupLabel')}
					>
						<span className='hidden sm:inline'>
							{t('singleplayer.copySetup')}
						</span>
					</CopyButton>
				</div>
				{descriptionKey ? (
					<CardDescription>{t(descriptionKey)}</CardDescription>
				) : null}
			</CardHeader>

			<div className='flex flex-col gap-6'>{children}</div>

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
