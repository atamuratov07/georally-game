import {
	CircleAlert,
	CircleCheck,
	Info,
	LoaderCircle,
	TriangleAlert,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const NEUTRAL =
	'border-line-strong bg-white text-ink [--edge:var(--color-line-strong)]'

/**
 * Sonner concatenates class names without merging them, so colours live only
 * in the per-type classes and the base class carries layout. Sonner wraps a
 * loading toast's icon in an absolutely positioned loader, so pending toasts
 * use the default type with `PendingToastIcon` instead.
 */
function Toaster(props: ToasterProps) {
	return (
		<Sonner
			position='top-center'
			offset={14}
			mobileOffset={10}
			gap={10}
			className='max-[600px]:w-auto! max-[600px]:[&_[data-sonner-toast]]:w-fit!'
			style={
				{ '--width': 'min(32rem, calc(100vw - 2rem))' } as CSSProperties
			}
			icons={{
				success: <CircleCheck />,
				error: <CircleAlert />,
				info: <Info />,
				warning: <TriangleAlert />,
			}}
			toastOptions={{
				unstyled: true,
				classNames: {
					toast: 'raised floating inset-x-0 mx-auto flex w-fit max-w-full items-center gap-2.5 rounded-[20px] border-2 px-4 py-2.5 font-sans text-sm font-extrabold [--edge-size:4px]',
					default: NEUTRAL,
					loading: NEUTRAL,
					info: NEUTRAL,
					warning: NEUTRAL,
					error: 'border-coral-600 bg-coral-500 text-white [--edge:var(--color-coral-700)]',
					success:
						'border-grass-600 bg-grass-500 text-white [--edge:var(--color-grass-700)]',
					icon: 'flex shrink-0 [&_svg]:size-5 [&_svg]:stroke-[2.5]',
				},
			}}
			{...props}
		/>
	)
}

function PendingToastIcon() {
	return <LoaderCircle className='animate-spin' />
}

export { PendingToastIcon, Toaster }
