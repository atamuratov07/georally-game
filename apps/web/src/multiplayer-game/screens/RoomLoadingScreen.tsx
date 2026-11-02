import { ScreenShell, SurfacePanel } from '../../shared/ui'

interface RoomLoadingScreenProps {
	label: string
	title: string
	message: string
}

export function RoomLoadingScreen({
	label,
	title,
	message,
}: RoomLoadingScreenProps) {
	return (
		<ScreenShell center className='px-5 py-8'>
			<SurfacePanel width='sm' className='text-center'>
				<p className='text-[11px] font-black uppercase tracking-[0.22em] text-amber-700'>
					{label}
				</p>
				<h1 className='mt-3 text-3xl font-black tracking-tight text-slate-950'>
					{title}
				</h1>
				<p className='mt-3 text-sm leading-7 text-slate-600'>{message}</p>
			</SurfacePanel>
		</ScreenShell>
	)
}
