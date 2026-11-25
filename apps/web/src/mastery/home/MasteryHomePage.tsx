import {
	GAME_CONTINENTS,
	normalizeGameRegions,
	type GameContinent,
	type LocalDay,
} from '@georally/game-domain'
import {
	addScope,
	setPace,
	countDue,
	type IntroPlan,
	type Pace,
	type Today,
} from '@georally/mastery'
import { LoaderCircle } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import { getRegionLabel } from '@/shared/i18n'
import { BackLink, PageShell } from '@/shared/layout'
import { localDay } from '@/shared/time/localDay'
import { Button, Card } from '@/shared/ui'
import { mastery } from '../container'
import { masteryPaths } from '../paths'
import { ReviewUnavailable } from '../shared/ReviewUnavailable'
import { Stat } from '../shared/Stat'
import { MapPreview } from './MapPreview'
import { PaceSetting } from './PaceSetting'
import { ScopePicker } from './ScopePicker'
import { useToday } from './useToday'

function addedContinents(plan: IntroPlan | null): Set<GameContinent> {
	const scopes = plan?.scopes ?? []
	return new Set(
		scopes.some(scope => scope.regions.length === 0)
			? GAME_CONTINENTS
			: scopes.flatMap(scope => scope.regions),
	)
}

export default function MasteryHomePage() {
	const { t } = useTranslation()
	const navigate = useLocalizedNavigate()
	const [state, reload] = useToday()
	const [picked, setPicked] = useState<GameContinent[]>([])
	const [saving, setSaving] = useState(false)
	const [chosenPace, setChosenPace] = useState<Pace | null>(null)
	const mapLabelId = useId()

	if (state.status === 'unavailable') {
		return <ReviewUnavailable />
	}

	const ready = state.status === 'ready' ? state : null
	const plan = ready?.today.meta.plan ?? null
	const isFirstRun = ready !== null && plan === null
	const added = addedContinents(plan)

	async function addPicked() {
		setSaving(true)
		try {
			await addScope(mastery, {
				regions: normalizeGameRegions(picked),
				now: Date.now(),
				seed: crypto.getRandomValues(new Uint32Array(1))[0],
			})
			setPicked([])
			if (isFirstRun) navigate(masteryPaths.play)
			else await reload()
		} finally {
			setSaving(false)
		}
	}

	async function changePace(pace: Pace) {
		setChosenPace(pace)
		try {
			await setPace(mastery, pace)
			await reload()
		} catch (error) {
			console.error(error)
			setChosenPace(null)
		}
	}

	const paceSetting = ready ? (
		<PaceSetting
			pace={chosenPace ?? ready.today.meta.settings.pace}
			onChange={pace => void changePace(pace)}
		/>
	) : null

	function renderToday(today: Today, day: LocalDay) {
		const { cards, sessionPlan } = today
		const known = new Set(cards.map(card => card.id))
		const reviewCount = sessionPlan.filter(id => known.has(id)).length
		const newCount = sessionPlan.length - reviewCount

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
				<div className='w-full'>{paceSetting}</div>
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

	const allPicked = picked.length === GAME_CONTINENTS.length
	const scopeDone =
		ready !== null &&
		!isFirstRun &&
		ready.today.unseenCount === 0 &&
		added.size < GAME_CONTINENTS.length

	if (!ready) {
		return (
			<PageShell headerTitle={t('review.title')} center>
				<LoaderCircle
					aria-label={t('game.loading')}
					className='mx-auto size-10 animate-spin text-ocean-500'
					strokeWidth={2.5}
				/>
			</PageShell>
		)
	}

	return (
		<PageShell headerTitle={t('review.title')}>
			<BackLink to='/'>{t('common.home')}</BackLink>
			<h1 className='sr-only'>{t('review.title')}</h1>
			<Card className='flex animate-pop-in flex-col gap-8'>
				{isFirstRun ? null : renderToday(ready.today, ready.day)}

				{isFirstRun ? null : <MapPreview views={ready.views} />}

				{isFirstRun || scopeDone ? (
					<div className='flex flex-col items-center gap-4'>
						<h2
							id={mapLabelId}
							className='text-center text-2xl font-black tracking-tight'
						>
							{isFirstRun
								? t('review.whereToStart')
								: t('review.whereNext')}
						</h2>
						<ScopePicker
							labelledBy={mapLabelId}
							added={added}
							picked={picked}
							onChange={setPicked}
						/>
						{isFirstRun ? (
							<Button
								variant={allPicked ? 'ocean' : 'neutral'}
								size='sm'
								aria-pressed={allPicked}
								onClick={() =>
									setPicked(allPicked ? [] : [...GAME_CONTINENTS])
								}
							>
								{getRegionLabel(t, 'all')}
							</Button>
						) : null}
					</div>
				) : null}

				{isFirstRun ? paceSetting : null}

				{isFirstRun ? (
					<Button
						size='lg'
						className='w-full'
						disabled={picked.length === 0}
						pending={saving}
						onClick={addPicked}
					>
						{t('review.start')}
					</Button>
				) : scopeDone && picked.length > 0 ? (
					<Button
						variant='ocean'
						className='w-full animate-pop-in sm:mx-auto sm:w-64'
						pending={saving}
						onClick={addPicked}
					>
						{t('review.add')}
					</Button>
				) : null}
			</Card>
		</PageShell>
	)
}
