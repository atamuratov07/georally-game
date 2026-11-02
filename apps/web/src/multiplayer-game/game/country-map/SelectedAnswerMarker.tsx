import { MapPin } from 'lucide-react'

export function SelectedAnswerMarker() {
	return (
		<div aria-hidden='true' className='pointer-events-none select-none'>
			<MapPin
				aria-hidden='true'
				strokeWidth={2.25}
				className='size-11 fill-grape-500 text-white drop-shadow-[0_5px_0_var(--color-grape-800)]'
			/>
		</div>
	)
}
