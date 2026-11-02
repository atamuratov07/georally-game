import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/utils'

function Card({
	className,
	asChild = false,
	...props
}: ComponentProps<'div'> & { asChild?: boolean }) {
	const Comp = asChild ? Slot.Root : 'div'

	return (
		<Comp
			data-slot='card'
			className={cn(
				'raised rounded-card border-2 border-line bg-white p-4 text-ink sm:p-7',
				className,
			)}
			{...props}
		/>
	)
}

function CardHeader({ className, ...props }: ComponentProps<'div'>) {
	return (
		<div
			data-slot='card-header'
			className={cn('mb-5 flex flex-col gap-1.5 sm:mb-6', className)}
			{...props}
		/>
	)
}

function CardTitle({
	className,
	asChild = false,
	...props
}: ComponentProps<'h2'> & { asChild?: boolean }) {
	const Comp = asChild ? Slot.Root : 'h2'

	return (
		<Comp
			data-slot='card-title'
			className={cn(
				'text-2xl leading-tight font-black tracking-tight text-balance sm:text-3xl',
				className,
			)}
			{...props}
		/>
	)
}

function CardDescription({ className, ...props }: ComponentProps<'p'>) {
	return (
		<p
			data-slot='card-description'
			className={cn('text-base font-medium text-muted', className)}
			{...props}
		/>
	)
}

export { Card, CardDescription, CardHeader, CardTitle }
