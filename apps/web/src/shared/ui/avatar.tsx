import BoringAvatar from 'boring-avatars'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/utils'

const AVATAR_COLORS = ['#3a9cff', '#5ec43a', '#ffc01a', '#fb5f4c', '#9b6cfb']

/** boring-avatars' name hash (v2), used to steer which colour a face gets. */
function hashName(name: string): number {
	let hash = 0
	for (let i = 0; i < name.length; i++) {
		hash = (hash << 5) - hash + name.charCodeAt(i)
		hash = hash & hash
	}
	return Math.abs(hash)
}

/**
 * Rotates the palette so the face's main colour is `AVATAR_COLORS[colorIndex]`.
 * The beam avatar takes its main colour from `colors[hash % length]`, so the
 * rotation makes neighbouring players in a room get different colours.
 */
function paletteFor(name: string, colorIndex: number | undefined): string[] {
	if (colorIndex === undefined) return AVATAR_COLORS
	const length = AVATAR_COLORS.length
	const shift = (((colorIndex - hashName(name)) % length) + length) % length
	return AVATAR_COLORS.map((_, i) => AVATAR_COLORS[(i + shift) % length])
}

const avatarVariants = cva(
	'relative inline-flex shrink-0 overflow-hidden rounded-full shadow-[0_3px_0_0_rgb(24_34_61/0.18)] select-none',
	{
		variants: {
			size: {
				sm: 'size-9',
				md: 'size-12',
				lg: 'size-18 sm:size-20',
			},
		},
		defaultVariants: { size: 'md' },
	},
)

function Avatar({
	name,
	size,
	offline = false,
	colorIndex,
	className,
	...props
}: ComponentProps<'span'> &
	VariantProps<typeof avatarVariants> & {
		name: string
		offline?: boolean
		/** Position in the room, so players in one room get different colours. */
		colorIndex?: number
	}) {
	return (
		<span
			data-slot='avatar'
			className={cn(
				avatarVariants({ size }),
				offline && 'opacity-60 grayscale',
				className,
			)}
			{...props}
		>
			<BoringAvatar
				name={name}
				variant='beam'
				colors={paletteFor(name, colorIndex)}
				size='100%'
				title={false}
				aria-hidden='true'
			/>
		</span>
	)
}

export { Avatar }
