import { Label as LabelPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/utils'

function Label({
	className,
	...props
}: ComponentProps<typeof LabelPrimitive.Root>) {
	return (
		<LabelPrimitive.Root
			data-slot='label'
			className={cn(
				'flex items-center gap-2 text-sm font-extrabold text-ink select-none',
				"[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5 [&_svg]:stroke-[2.5] [&_svg]:text-muted",
				className,
			)}
			{...props}
		/>
	)
}

export { Label }
