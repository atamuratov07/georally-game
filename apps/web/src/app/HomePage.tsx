import { Speech } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader, SkyBackground } from '@/shared/layout'
import { AppUpdateNotice } from '@/shared/pwa'
import { Button } from '@/shared/ui'
import { singleplayerPaths } from '@/singleplayer-game/paths'
import { HomeFaq } from './landing/HomeFaq'
import { ModeShowcase } from './landing/ModeShowcase'
import { PlayTogether } from './landing/PlayTogether'
import { HERO_TITLE_CLASS } from './landing/styles'
import { LocalizedLink } from './LocalizedLink'

const HeroGlobe = lazy(() => import('./landing/HeroGlobe'))
const NameItDemo = lazy(() => import('./landing/NameItDemo'))
const SprintDemo = lazy(() => import('./landing/SprintDemo'))
const RoutesDemo = lazy(() => import('./landing/RoutesDemo'))
const TodaySection = lazy(() => import('./landing/TodaySection'))

const TRUST = ['free', 'noAccount', 'noAds'] as const

function GlobePlaceholder() {
	return (
		<div className='mx-auto w-full max-w-[440px] pt-16'>
			<div className='aspect-square w-full rounded-full bg-ocean-200' />
		</div>
	)
}

export default function HomePage() {
	const { t } = useTranslation()

	return (
		<div className='relative min-h-dvh'>
			<div>
				<AppUpdateNotice />
				<SkyBackground />
				<div className='relative'>
					<AppHeader />

					<main className='mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 pt-4 pb-24 sm:gap-28 sm:px-6 sm:pt-8'>
						<section className='grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]'>
							<div className='flex flex-col items-center gap-6 text-center lg:items-start lg:text-left'>
								<h1 className={HERO_TITLE_CLASS}>
									{t('landing.heroTitle')}
								</h1>
								<p className='max-w-xl text-lg font-medium text-on-sky-soft sm:text-xl'>
									{t('landing.heroText')}
								</p>
								<div className='flex w-full flex-col gap-3 pt-2 sm:w-auto sm:flex-row'>
									<Button asChild size='lg'>
										<LocalizedLink to='/singleplayer'>
											{t('landing.playSolo')}
										</LocalizedLink>
									</Button>
									<Button asChild size='lg' variant='grape'>
										<LocalizedLink to='/multiplayer'>
											{t('landing.playTogether')}
										</LocalizedLink>
									</Button>
								</div>
								<ul className='flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-black tracking-[0.08em] text-on-sky-soft uppercase sm:text-sm lg:justify-start'>
									{TRUST.map(key => (
										<li key={key} className='flex items-center gap-2'>
											<span
												aria-hidden='true'
												className='size-1.5 rounded-full bg-sunflower-500'
											/>
											{t(`landing.trust.${key}`)}
										</li>
									))}
								</ul>
							</div>
							<Suspense fallback={<GlobePlaceholder />}>
								<HeroGlobe />
							</Suspense>
						</section>

						<Suspense fallback={null}>
							<TodaySection />
						</Suspense>

						<ModeShowcase
							id='name-it'
							copyKey='nameIt'
							eyebrow={t('singleplayer.modes.nameIt.title')}
							to={singleplayerPaths('name-it').setup}
							Demo={NameItDemo}
							demoSide='left'
							accent='ocean'
							badgeIcon={
								<Speech
									aria-hidden='true'
									className='size-4'
									strokeWidth={2.75}
								/>
							}
						/>
						<ModeShowcase
							id='recall-sprint'
							copyKey='recallSprint'
							eyebrow={t('singleplayer.modes.recallSprint.title')}
							to={singleplayerPaths('recall-sprint').setup}
							Demo={SprintDemo}
							demoSide='right'
							accent='coral'
						/>
						<ModeShowcase
							id='routes'
							copyKey='routes'
							eyebrow={t('singleplayer.modes.routes.title')}
							to={singleplayerPaths('routes').setup}
							Demo={RoutesDemo}
							demoSide='left'
							accent='grass'
						/>

						<PlayTogether />

						<HomeFaq />
					</main>
				</div>
			</div>
		</div>
	)
}
