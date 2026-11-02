import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = extendTailwindMerge({
	extend: {
		theme: {
			radius: ['control', 'card'],
		},
	},
})

export type { ClassValue }

export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs))
}
