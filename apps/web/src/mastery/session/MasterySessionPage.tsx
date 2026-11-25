import { countryCatalog } from '@georally/country-catalog'
import { splitCardId } from '@georally/mastery'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from '@/app/LocaleContext'
import { LocalizedLink } from '@/app/LocalizedLink'
import { LocalizedNavigate } from '@/app/LocalizedNavigate'
import { getCountryName } from '@/shared/i18n'
import { Button } from '@/shared/ui'
import { GameHud } from '@/shared/widgets/GameHud'
import { masteryPaths } from '../paths'
import { ReviewUnavailable } from '../shared/ReviewUnavailable'
import { LocateCard } from './LocateCard'
import { SessionSummary } from './SessionSummary'
import { useMasterySession } from './useMasterySession'

export default function MasterySessionPage() {
	const [round, setRound] = useState(0)
	return <Session key={round} onLearnMore={() => setRound(round + 1)} />
}

function Session({ onLearnMore }: { onLearnMore: () => void }) {
	const { t } = useTranslation()
	const language = useCurrentLocale()
	const { session, answer, ready, next } = useMasterySession()

	if (session.status === 'unavailable') {
		return <ReviewUnavailable />
	}
	if (session.status === 'empty') {
		return <LocalizedNavigate to={masteryPaths.home} replace />
	}
	if (session.status === 'complete') {
		return <SessionSummary stats={session.stats} onLearnMore={onLearnMore} />
	}
	if (session.status !== 'playing') return null

	const { cardId, queue, save, startedAt } = session
	const countryId = splitCardId(cardId).countryId
	const info = countryCatalog.countriesById.get(countryId)
	const total = queue.reviewed + queue.upcoming.length + queue.waiting.length
	const current = queue.reviewed + (save === 'saved' ? 0 : 1)

	return (
		<div className='fixed inset-0 flex flex-col overflow-hidden bg-paper'>
			<GameHud
				current={Math.min(current, total)}
				total={total}
				completed={queue.reviewed}
				targetName={
					startedAt !== null && info ? getCountryName(info, language) : ''
				}
				targetFlagUrl={startedAt !== null ? info?.flagUrl : undefined}
				start={
					<Button
						asChild
						variant='ghost'
						size='icon'
						className='text-white/70 hover:bg-white/10 hover:text-white'
						aria-label={t('singleplayer.exit')}
						title={t('singleplayer.exit')}
					>
						<LocalizedLink to={masteryPaths.home}>
							<LogOut aria-hidden='true' className='rotate-180' />
						</LocalizedLink>
					</Button>
				}
			/>
			<LocateCard
				countryId={countryId}
				turn={session.turn}
				startedAt={startedAt}
				saving={save === 'saving' || save === 'failed'}
				onReady={ready}
				onAnswer={(outcome, at) => answer(cardId, outcome, at)}
				onNext={next}
			/>
		</div>
	)
}
