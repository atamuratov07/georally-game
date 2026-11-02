import { useTranslation } from 'react-i18next'
import { Button, ButtonLink, ScreenShell, SurfacePanel } from '../../shared/ui'

interface RoomErrorScreenProps {
	message: string
	onRetry: () => void
}

export function RoomErrorScreen({
	message,
	onRetry,
}: RoomErrorScreenProps) {
	const { t } = useTranslation()
	return (
		<ScreenShell center className='px-5 py-8'>
			<SurfacePanel>
				<p className='text-[11px] font-black uppercase tracking-[0.22em] text-rose-700'>
					{t('multiplayer.room')}
				</p>
				<h1 className='mt-3 text-3xl font-black tracking-tight text-slate-950'>
					{t('multiplayer.error.openRoomTitle')}
				</h1>
				<p className='mt-3 text-sm leading-7 text-slate-600'>{message}</p>
				<div className='mt-6 flex flex-wrap gap-3'>
					<Button type='button' onClick={onRetry}>
						{t('common.retry')}
					</Button>
					<ButtonLink to='/multiplayer' variant='secondary'>
						{t('multiplayer.title')}
					</ButtonLink>
				</div>
			</SurfacePanel>
		</ScreenShell>
	)
}
