import { useTranslation } from 'react-i18next'
import { ButtonLink, ScreenShell, SurfacePanel } from '../../shared/ui'

export function InvalidConfigScreen() {
	const { t } = useTranslation()

	return (
		<ScreenShell center className='px-5 py-8'>
			<SurfacePanel>
				<p className='text-[11px] font-black uppercase tracking-[0.22em] text-rose-700'>
					{t('singleplayer.title')}
				</p>
				<h1 className='mt-3 text-3xl font-black tracking-tight text-slate-950'>
					{t('singleplayer.invalidTitle')}
				</h1>
				<p className='mt-3 text-sm leading-7 text-slate-600'>
					{t('singleplayer.invalidDescription')}
				</p>
				<div className='mt-6 flex flex-wrap gap-3'>
					<ButtonLink to='/singleplayer' variant='teal'>
						{t('singleplayer.openSettings')}
					</ButtonLink>
					<ButtonLink to='/' variant='secondary'>
						{t('common.home')}
					</ButtonLink>
				</div>
			</SurfacePanel>
		</ScreenShell>
	)
}
