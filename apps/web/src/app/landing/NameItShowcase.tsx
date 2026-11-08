import { lazy, Suspense } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { singleplayerPaths } from '@/singleplayer-game/paths'
import { Button } from '@/shared/ui'
import { LocalizedLink } from '../LocalizedLink'
import { DISPLAY_TITLE_CLASS, HIGHLIGHT_CLASS } from './styles'

const NameItDemo = lazy(() => import('./NameItDemo'))

function DemoPlaceholder() {
	return (
		<div className='mx-auto aspect-[4/3.4] w-full max-w-md rounded-[28px] bg-ocean-100' />
	)
}

export function NameItShowcase() {
	const { t } = useTranslation()

	return (
		<section
			id='name-it'
			aria-labelledby='name-it-title'
			className='grid scroll-mt-8 items-center gap-10 lg:grid-cols-2 lg:gap-14'
		>
			<div className='flex flex-col items-start gap-5 lg:order-2'>
				<span className='raised inline-block -rotate-3 rounded-full border-2 border-coral-600 bg-coral-500 px-3.5 py-1 text-sm font-black tracking-wide text-white uppercase [--edge-size:3px] [--edge:var(--color-coral-700)]'>
					{t('landing.nameIt.eyebrow')}
				</span>
				<h2 id='name-it-title' className={DISPLAY_TITLE_CLASS}>
					<Trans
						i18nKey='landing.nameIt.title'
						components={{ hl: <span className={HIGHLIGHT_CLASS} /> }}
					/>
				</h2>
				<p className='max-w-xl text-lg font-medium text-muted sm:text-xl'>
					{t('landing.nameIt.text')}
				</p>
				<Button asChild size='lg' variant='ocean' className='mt-2'>
					<LocalizedLink to={singleplayerPaths('name-it').setup}>
						{t('landing.nameIt.cta')}
					</LocalizedLink>
				</Button>
			</div>

			<div className='lg:order-1'>
				<Suspense fallback={<DemoPlaceholder />}>
					<NameItDemo />
				</Suspense>
			</div>
		</section>
	)
}
