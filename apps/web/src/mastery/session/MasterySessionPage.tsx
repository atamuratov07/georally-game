import { countryCatalog } from '@georally/country-catalog'
import { splitCardId } from '@georally/mastery'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from '@/app/LocaleContext'
import { LocalizedLink } from '@/app/LocalizedLink'
import { LocalizedNavigate } from '@/app/LocalizedNavigate'
import { GameHud } from '@/game-kit/hud/GameHud'
import { Button } from '@/shared/ui'
import { masteryPaths } from '../paths'
import { ReviewUnavailable } from '../shared/ReviewUnavailable'
import { SKILL_CARDS } from './cards/registry'
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
	const { countryId, skillId } = splitCardId(cardId)
	const info = countryCatalog.countriesById.get(countryId)
	const { Card, ask } = SKILL_CARDS[skillId]
	const question = startedAt !== null && info ? ask(info, t, language) : null
	const total = queue.reviewed + queue.upcoming.length + queue.waiting.length
	const current = queue.reviewed + (save === 'saved' ? 0 : 1)

	return (
		<div className='fixed inset-0 flex flex-col overflow-hidden bg-paper'>
			<GameHud
				current={Math.min(current, total)}
				total={total}
				completed={queue.reviewed}
				targetName={question?.text ?? ''}
				targetFlagUrl={question?.flagUrl}
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
			<Card
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
