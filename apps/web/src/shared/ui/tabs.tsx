import { Tabs as TabsPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/utils'

function Tabs({
	className,
	...props
}: ComponentProps<typeof TabsPrimitive.Root>) {
	return (
		<TabsPrimitive.Root
			data-slot='tabs'
			className={cn('flex flex-col gap-5', className)}
			{...props}
		/>
	)
}

function TabsList({
	className,
	...props
}: ComponentProps<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List
			data-slot='tabs-list'
			className={cn(
				'flex w-full gap-1.5 rounded-[18px] border-2 border-line bg-paper-deep p-1.5 pb-2.5',
				className,
			)}
			{...props}
		/>
	)
}

function TabsTrigger({
	className,
	...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			data-slot='tabs-trigger'
			className={cn(
				'inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-control border-2 border-transparent px-2 text-sm font-extrabold whitespace-nowrap text-muted max-sm:[&_svg]:hidden sm:px-3 sm:text-base',
				'transition-[color,background-color,box-shadow,translate] duration-100 hover:text-ink',
				'data-[state=active]:border-line-strong data-[state=active]:bg-white data-[state=active]:text-ink',
				'data-[state=active]:-translate-y-0.5 data-[state=active]:shadow-[0_4px_0_0_var(--color-line-strong)]',
				'disabled:pointer-events-none disabled:opacity-50',
				"[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5 [&_svg]:stroke-[2.5]",
				className,
			)}
			{...props}
		/>
	)
}

function TabsContent({
	className,
	...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			data-slot='tabs-content'
			className={cn('outline-none', className)}
			{...props}
		/>
	)
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
