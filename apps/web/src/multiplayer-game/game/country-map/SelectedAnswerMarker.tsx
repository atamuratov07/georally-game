import { MapPin } from 'lucide-react'

export function SelectedAnswerMarker() {
	return (
		<div
			aria-hidden='true'
			className='pointer-events-none select-none drop-shadow-[0_14px_24px_rgba(49,46,129,0.48)]'
		>
			<MapPin
				aria-hidden='true'
				strokeWidth={2.4}
				className='h-10 w-10 text-white'
				fill='#9994f2'
			/>
		</div>
	)
}
