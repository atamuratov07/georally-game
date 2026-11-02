import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { LocalizedLink } from '@/app/LocalizedLink'
import { cn } from '@/shared/utils'

export function BackLink({
	to,
	children,
	className,
}: {
	to: string
	children: ReactNode
	className?: string
}) {
	return (
		<LocalizedLink
			to={to}
			className={cn(
				'group mb-4 inline-flex w-fit items-center gap-0.5 rounded-full text-sm font-extrabold text-muted transition-colors hover:text-ink',
				className,
			)}
		>
			<ChevronLeft
				aria-hidden='true'
				className='size-5 transition-transform group-hover:-translate-x-0.5'
				strokeWidth={3}
			/>
			{children}
		</LocalizedLink>
	)
}
