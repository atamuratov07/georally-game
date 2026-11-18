import { useState, type ComponentProps } from 'react'

export function FlagImage({
	src,
	...props
}: Omit<ComponentProps<'img'>, 'src' | 'onError'> & { src: string }) {
	const [failedSrc, setFailedSrc] = useState<string | null>(null)

	if (failedSrc === src) return null

	return <img src={src} onError={() => setFailedSrc(src)} {...props} />
}
