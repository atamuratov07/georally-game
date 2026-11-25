import type { MasteryDeps } from '../ports'
import type { Pace } from '../types'

export async function setPace({ repository }: MasteryDeps, pace: Pace) {
	const { settings } = await repository.loadMeta()
	await repository.saveSettings({ ...settings, pace })
}
