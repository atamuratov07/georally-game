import { useTranslation } from 'react-i18next'
import { JoinRoomForm } from '@/multiplayer-game/join/JoinRoomForm'
import { Button } from '@/shared/ui'
import { LocalizedLink } from '../LocalizedLink'
import { ShowcaseBadge } from './ShowcaseBadge'
import { SECTION_TITLE_CLASS } from './styles'

const ROOM_MODES = ['classroom', 'group'] as const

export function PlayTogether() {
	const { t } = useTranslation()

	return (
		<section
			id='play-together'
			aria-labelledby='play-together-title'
			className='grid scroll-mt-8 grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-2 lg:gap-14'
		>
			<div className='flex flex-col items-center gap-5 text-center lg:items-start lg:text-left'>
				<ShowcaseBadge tone='grape'>{t('multiplayer.title')}</ShowcaseBadge>
				<h2 id='play-together-title' className={SECTION_TITLE_CLASS}>
					{t('landing.together.title')}
				</h2>
				<p className='max-w-xl text-lg font-medium text-on-sky-soft sm:text-xl'>
					{t('landing.together.text')}
				</p>
				<dl className='grid max-w-xl gap-4 sm:grid-cols-2 sm:gap-8'>
					{ROOM_MODES.map(mode => (
						<div key={mode}>
							<dt className='text-xl font-black text-on-sky'>
								{t(`multiplayer.modes.${mode}.title`)}
							</dt>
							<dd className='font-medium text-on-sky-soft'>
								{t(`multiplayer.modes.${mode}.summary`)}
							</dd>
						</div>
					))}
				</dl>
				<Button asChild size='lg' variant='grape' className='mt-2'>
					<LocalizedLink to='/multiplayer?tab=host'>
						{t('multiplayer.tabs.host')}
					</LocalizedLink>
				</Button>
			</div>

			<div className='raised mx-auto w-full max-w-md rounded-card bg-grape-100 px-4 py-6 text-ink sm:p-8 [--edge:var(--color-grape-200)]'>
				<JoinRoomForm autoFocus={false} />
			</div>
		</section>
	)
}
