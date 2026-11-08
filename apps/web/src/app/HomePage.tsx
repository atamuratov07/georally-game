import { lazy, Suspense } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { AppHeader, SkyBackground } from '@/shared/layout'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/utils'
import { DISPLAY_TITLE_CLASS, HIGHLIGHT_CLASS } from './landing/styles'
import { NameItShowcase } from './landing/NameItShowcase'
import { LocalizedLink } from './LocalizedLink'

const HeroGlobe = lazy(() => import('./landing/HeroGlobe'))

const MODE_POINTS = ['point1', 'point2', 'point3'] as const

const MODES = [
	{
		key: 'solo',
		to: '/singleplayer',
		cta: 'playSolo',
		button: 'primary',
		panel: 'bg-sunflower-100 [--edge:var(--color-sunflower-300)]',
		bullet: 'bg-sunflower-500',
	},
	{
		key: 'multiplayer',
		to: '/multiplayer',
		cta: 'playTogether',
		button: 'grape',
		panel: 'bg-grape-100 [--edge:var(--color-grape-200)]',
		bullet: 'bg-grape-500',
	},
] as const

const STEPS = [
	{ n: 1, color: 'text-ocean-500' },
	{ n: 2, color: 'text-grape-500' },
	{ n: 3, color: 'text-coral-500' },
] as const

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
				<SkyBackground />
				<div className='relative'>
					<AppHeader />

					<main className='mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 pt-4 pb-24 sm:gap-28 sm:px-6 sm:pt-8'>
						<section className='grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]'>
							<div className='flex flex-col items-start gap-6'>
								<h1 className={DISPLAY_TITLE_CLASS}>
									<Trans
										i18nKey='landing.heroTitle'
										components={{
											hl: <span className={HIGHLIGHT_CLASS} />,
										}}
									/>
								</h1>
								<p className='max-w-xl text-lg font-medium text-muted sm:text-xl'>
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
							</div>
							<Suspense fallback={<GlobePlaceholder />}>
								<HeroGlobe />
							</Suspense>
						</section>

						<NameItShowcase />

						<section
							aria-labelledby='modes-title'
							className='flex flex-col gap-8'
						>
							<h2
								id='modes-title'
								className='text-center text-3xl font-black tracking-tight sm:text-4xl'
							>
								{t('landing.modesTitle')}
							</h2>
							<div className='grid gap-6 md:grid-cols-2'>
								{MODES.map(mode => (
									<div
										key={mode.key}
										className={cn(
											'raised flex flex-col gap-5 rounded-card p-6 sm:p-8',
											mode.panel,
										)}
									>
										<div>
											<h3 className='text-3xl font-black tracking-tight'>
												{t(`landing.${mode.key}.title`)}
											</h3>
											<p className='mt-1 text-lg font-medium text-ink/70'>
												{t(`landing.${mode.key}.text`)}
											</p>
										</div>
										<ul className='flex flex-1 flex-col gap-2'>
											{MODE_POINTS.map(point => (
												<li
													key={point}
													className='flex items-start gap-3 font-semibold'
												>
													<span
														aria-hidden='true'
														className={cn(
															'mt-2 size-2 shrink-0 rounded-full',
															mode.bullet,
														)}
													/>
													{t(`landing.${mode.key}.${point}`)}
												</li>
											))}
										</ul>
										<Button
											asChild
											variant={mode.button}
											className='w-full sm:w-fit sm:px-8'
										>
											<LocalizedLink to={mode.to}>
												{t(`landing.${mode.cta}`)}
											</LocalizedLink>
										</Button>
									</div>
								))}
							</div>
						</section>

						<section
							aria-labelledby='steps-title'
							className='flex flex-col gap-10'
						>
							<h2
								id='steps-title'
								className='text-center text-3xl font-black tracking-tight sm:text-4xl'
							>
								{t('landing.stepsTitle')}
							</h2>
							<ol className='grid gap-10 md:grid-cols-3 md:gap-8'>
								{STEPS.map(({ n, color }) => (
									<li key={n} className='flex gap-4'>
										<span
											aria-hidden='true'
											className={cn(
												'text-7xl leading-[0.85] font-black [text-shadow:0_5px_0_var(--color-line-strong)]',
												color,
											)}
										>
											{n}
										</span>
										<div>
											<h3 className='text-xl font-black'>
												{t(`landing.step${n}Title`)}
											</h3>
											<p className='mt-1 font-medium text-muted'>
												{t(`landing.step${n}Text`)}
											</p>
										</div>
									</li>
								))}
							</ol>
						</section>
					</main>
				</div>
			</div>
		</div>
	)
}
