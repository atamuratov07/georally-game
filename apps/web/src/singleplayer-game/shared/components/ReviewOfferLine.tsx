import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { ReviewOffer } from '@/mastery/bridge/reportCasualOutcomes'
import {
	trackBridgeOfferAccepted,
	trackBridgeOfferShown,
	type SingleplayerModeParam,
} from '@/shared/analytics/track'
import { Button, TextButton } from '@/shared/ui'
import { CountryCardsIcon } from '@/shared/widgets/CountryCardsIcon'

type Status = 'open' | 'saving' | 'added' | 'dismissed'

export function ReviewOfferLine({
	offer,
	mode,
}: {
	offer: ReviewOffer
	mode: SingleplayerModeParam
}) {
	const { t } = useTranslation()
	const [status, setStatus] = useState<Status>('open')

	useEffect(() => {
		trackBridgeOfferShown({ mode, offeredCount: offer.count })
	}, [mode, offer])

	if (status === 'dismissed') return null

	async function add() {
		setStatus('saving')
		try {
			await offer.accept()
			trackBridgeOfferAccepted({ mode, offeredCount: offer.count })
			setStatus('added')
		} catch (error) {
			console.error(error)
			toast.error(t('review.offer.failed'))
			setStatus('open')
		}
	}

	return (
		<div className='flex animate-pop-in items-center gap-3 rounded-card bg-ocean-50 p-3 text-left'>
			<CountryCardsIcon className='size-11 shrink-0 drop-shadow-[0_2px_0_var(--color-ink)]' />
			{status === 'added' ? (
				<p className='flex flex-1 items-center gap-1.5 text-sm font-extrabold text-grass-700'>
					<Check aria-hidden='true' className='size-4.5' strokeWidth={3} />
					{t('review.offer.added')}
				</p>
			) : (
				<div className='flex flex-1 flex-col gap-3'>
					<p className='text-sm font-extrabold'>
						{t('review.offer.question', { count: offer.count })}
					</p>
					<div className='flex items-center gap-1'>
						<Button
							type='button'
							variant='ocean'
							size='sm'
							pending={status === 'saving'}
							onClick={add}
						>
							{t('review.offer.add')}
						</Button>
						<TextButton
							type='button'
							disabled={status === 'saving'}
							onClick={() => setStatus('dismissed')}
						>
							{t('review.offer.notNow')}
						</TextButton>
					</div>
				</div>
			)}
		</div>
	)
}
