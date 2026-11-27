import { TOUCH_QUERY } from './touch'

export async function copyText(value: string): Promise<boolean> {
	if (navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(value)
			return true
		} catch {
			// Fall through to the textarea fallback for restricted contexts.
		}
	}

	const textarea = document.createElement('textarea')
	textarea.value = value
	textarea.setAttribute('readonly', '')
	textarea.style.position = 'fixed'
	textarea.style.opacity = '0'
	document.body.appendChild(textarea)
	textarea.select()
	const didCopy = document.execCommand('copy')
	document.body.removeChild(textarea)

	return didCopy
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export async function shareOrCopy(text: string): Promise<ShareResult> {
	if (
		typeof navigator.share === 'function' &&
		window.matchMedia(TOUCH_QUERY).matches
	) {
		try {
			await navigator.share({ text })
			return 'shared'
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				return 'cancelled'
			}
		}
	}
	return (await copyText(text)) ? 'copied' : 'failed'
}
