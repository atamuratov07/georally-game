import { useSyncExternalStore } from 'react'
import { registerSW } from 'virtual:pwa-register'

const UPDATE_CHECK_MS = 60 * 60 * 1000

let needRefresh = false
let skipWaiting: (() => Promise<void>) | null = null
let reloading = false
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

function reload(): void {
	if (reloading) return
	reloading = true
	window.location.reload()
}

function watchForUpdates(registration: ServiceWorkerRegistration): void {
	const check = () => {
		if (navigator.onLine) {
			void registration.update().catch(() => undefined)
		}
	}
	setInterval(check, UPDATE_CHECK_MS)
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') check()
	})
}

export function registerServiceWorker(): void {
	if (!('serviceWorker' in navigator)) {
		return
	}

	skipWaiting = registerSW({
		onNeedRefresh() {
			needRefresh = true
			listeners.forEach(listener => listener())
		},
		onNeedReload: reload,
		onRegisteredSW(_url, registration) {
			if (registration) watchForUpdates(registration)
		},
	})
}

export function useUpdateReady(): boolean {
	return useSyncExternalStore(
		subscribe,
		() => needRefresh,
		() => false,
	)
}

export function applyUpdate(): void {
	if (!skipWaiting) return
	navigator.serviceWorker.addEventListener('controllerchange', reload, {
		once: true,
	})
	void skipWaiting()
}
