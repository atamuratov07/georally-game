export const SKIES = ['day', 'dusk', 'night'] as const
export type Sky = (typeof SKIES)[number]

// Every HTML entry applies the saved sky before the first paint with the same key.
const STORAGE_KEY = 'georally.sky'

export function currentSky(): Sky {
	const sky = document.documentElement.dataset.sky
	return sky === 'dusk' || sky === 'night' ? sky : 'day'
}

export function applySky(sky: Sky) {
	const root = document.documentElement
	if (sky === 'day') delete root.dataset.sky
	else root.dataset.sky = sky
	try {
		if (sky === 'day') localStorage.removeItem(STORAGE_KEY)
		else localStorage.setItem(STORAGE_KEY, sky)
	} catch {
		// The sky still changes for this visit.
	}
}
