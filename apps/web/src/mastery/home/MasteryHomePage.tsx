import { GAME_CONTINENTS, type GameContinent } from '@georally/game-domain'
import type { IntroPlan } from '@georally/mastery'
import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import { BackLink, PageShell } from '@/shared/layout'
import { Card } from '@/shared/ui'
import { masteryPaths } from '../paths'
import { ReviewEmblem } from '../shared/ReviewEmblem'
import { ReviewUnavailable } from '../shared/ReviewUnavailable'
import { MapPreview } from './MapPreview'
import { PaceSetting } from './PaceSetting'
import { SkillSwitches } from './SkillSwitches'
import { ScopeForm } from './ScopeForm'
import { TodayPanel } from './TodayPanel'
import { useToday } from './useToday'

function addedContinents(plan: IntroPlan): Set<GameContinent> {
	return new Set(
		plan.scopes.some(scope => scope.regions.length === 0)
			? GAME_CONTINENTS
			: plan.scopes.flatMap(scope => scope.regions),
	)
}

export default function MasteryHomePage() {
	const { t } = useTranslation()
	const navigate = useLocalizedNavigate()
	const [state, reload] = useToday()

	if (state.status === 'unavailable') {
		return <ReviewUnavailable />
	}

	if (state.status === 'loading') {
		return (
			<PageShell
				headerTitle={t('review.title')}
				headerEmblem={<ReviewEmblem />}
				center
			>
				<LoaderCircle
					aria-label={t('game.loading')}
					className='mx-auto size-10 animate-spin text-lagoon-500'
					strokeWidth={2.5}
				/>
			</PageShell>
		)
	}

	const { today, day, layer } = state
	const { plan, settings } = today.meta
	const pace = (
		<div className='flex flex-col gap-5'>
			<PaceSetting pace={settings.pace} onSaved={reload} />
			<SkillSwitches settings={settings} onSaved={reload} />
		</div>
	)

	const added = plan ? addedContinents(plan) : undefined
	const canAdd =
		added !== undefined &&
		today.unseenCount === 0 &&
		added.size < GAME_CONTINENTS.length

	return (
		<PageShell
			headerTitle={t('review.title')}
			headerEmblem={<ReviewEmblem />}
		>
			<BackLink to='/'>{t('common.home')}</BackLink>
			<h1 className='sr-only'>{t('review.title')}</h1>
			<Card className='flex animate-pop-in flex-col gap-8'>
				{plan === null ? (
					<ScopeForm
						title={t('review.whereToStart')}
						submitLabel={t('review.start')}
						wholeWorld
						primary
						onAdded={() => navigate(masteryPaths.play)}
					>
						{pace}
					</ScopeForm>
				) : (
					<>
						<TodayPanel today={today} day={day}>
							{pace}
						</TodayPanel>
						<MapPreview layer={layer} />
						{canAdd ? (
							<ScopeForm
								title={t('review.whereNext')}
								submitLabel={t('review.add')}
								added={added}
								onAdded={reload}
							/>
						) : null}
					</>
				)}
			</Card>
		</PageShell>
	)
}
