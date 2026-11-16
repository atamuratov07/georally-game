import { useSyncExternalStore } from 'react'
import { trackAppInstalled } from '@/shared/analytics/track'

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

function notify(): void {
	listeners.forEach(listener => listener())
}

function subscribe(listener: () => void): () => void {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

export function isStandalone(): boolean {
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		(navigator as Navigator & { standalone?: boolean }).standalone === true
	)
}

function isIosSafari(): boolean {
	const { userAgent, maxTouchPoints } = navigator
	const isIos =
		/iPad|iPhone|iPod/.test(userAgent) ||
		(/Macintosh/.test(userAgent) && maxTouchPoints > 1)
	return isIos && /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent)
}

export function watchInstallPrompt(): void {
	window.addEventListener('beforeinstallprompt', event => {
		event.preventDefault()
		deferredPrompt = event as BeforeInstallPromptEvent
		notify()
	})
	window.addEventListener('appinstalled', () => {
		deferredPrompt = null
		trackAppInstalled()
		notify()
	})
}

export type InstallMethod = 'prompt' | 'ios' | null

function currentMethod(): InstallMethod {
	if (deferredPrompt) return 'prompt'
	if (isIosSafari() && !isStandalone()) return 'ios'
	return null
}

export function useInstallMethod(): InstallMethod {
	return useSyncExternalStore(subscribe, currentMethod, () => null)
}

export async function promptInstall(): Promise<void> {
	const event = deferredPrompt
	if (!event) return
	deferredPrompt = null
	notify()
	await event.prompt()
}
