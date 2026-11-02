import { cva, type VariantProps } from 'class-variance-authority'
import { Avatar as AvatarPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/utils'

const AVATAR_TONES = [
	'border-ocean-600 bg-ocean-400 text-white',
	'border-grass-600 bg-grass-400 text-white',
	'border-sunflower-500 bg-sunflower-300 text-sunflower-900',
	'border-coral-600 bg-coral-400 text-white',
	'border-grape-600 bg-grape-400 text-white',
] as const

const avatarVariants = cva(
	'relative flex shrink-0 items-center justify-center rounded-full select-none',
	{
		variants: {
			size: {
				sm: 'size-9 text-sm',
				md: 'size-12 text-lg',
				lg: 'size-18 text-2xl sm:size-20 sm:text-3xl',
			},
		},
		defaultVariants: { size: 'md' },
	},
)

function hashName(name: string): number {
	let hash = 0
	for (const char of name) {
		hash = (hash * 31 + char.codePointAt(0)!) | 0
	}
	return Math.abs(hash)
}

function getInitials(name: string): string {
	const words = name.trim().split(/\s+/).filter(Boolean)
	if (words.length === 0) return '?'
	if (words.length === 1) return [...words[0]].slice(0, 2).join('')
	return [...words[0]][0] + [...words[1]][0]
}

function Avatar({
	name,
	size,
	offline = false,
	className,
	...props
}: ComponentProps<typeof AvatarPrimitive.Root> &
	VariantProps<typeof avatarVariants> & {
		name: string
		offline?: boolean
	}) {
	return (
		<AvatarPrimitive.Root
			data-slot='avatar'
			className={cn(avatarVariants({ size }), className)}
			{...props}
		>
			<AvatarPrimitive.Fallback
				className={cn(
					'flex size-full items-center justify-center rounded-full border-2 font-black uppercase',
					offline
						? 'border-line-strong bg-paper-deep text-muted'
						: AVATAR_TONES[hashName(name) % AVATAR_TONES.length],
				)}
			>
				{getInitials(name)}
			</AvatarPrimitive.Fallback>
		</AvatarPrimitive.Root>
	)
}

export { Avatar }
