import type { ReactNode } from 'react'
import { Popup } from 'react-map-gl/maplibre'
import { cn } from '../utils'
import type { MapRevealTarget } from './types'

const POPUP_OFFSET = 12

interface RevealPopupProps {
	target: MapRevealTarget
	hidden: boolean
	children: ReactNode
}

export function RevealPopup({ target, hidden, children }: RevealPopupProps) {
	return (
		<Popup
			longitude={target.longitude}
			latitude={target.latitude}
			offset={POPUP_OFFSET}
			className='revealed-popup'
			maxWidth='none'
			closeOnClick={false}
			closeButton={false}
		>
			<div
				className={cn(
					'transition-all duration-200 ease-out',
					hidden
						? 'pointer-events-none scale-95 opacity-0'
						: 'scale-100 opacity-100',
				)}
			>
				{children}
			</div>
		</Popup>
	)
}
