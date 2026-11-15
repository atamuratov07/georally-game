import { useEffect, useRef } from 'react'
import { useMap } from 'react-map-gl/maplibre'

export interface FeatureTarget {
	source: string
	sourceLayer?: string
}

export type FeatureStateValue = string | boolean

export type FeatureStates = ReadonlyMap<string, FeatureStateValue>

export const NO_STATES: FeatureStates = new Map()

export function flagsFor(ids: Iterable<string | null>): FeatureStates {
	const flags = new Map<string, boolean>()
	for (const id of ids) {
		if (id !== null) {
			flags.set(id, true)
		}
	}
	return flags
}

export function useFeatureState(
	loaded: boolean,
	{ source, sourceLayer }: FeatureTarget,
	key: string,
	states: FeatureStates,
) {
	const map = useMap().current?.getMap()
	const appliedRef = useRef<FeatureStates>(NO_STATES)

	useEffect(() => {
		if (!map || !loaded) {
			return
		}
		return () => {
			try {
				for (const id of appliedRef.current.keys()) {
					map.removeFeatureState({ source, sourceLayer, id }, key)
				}
			} catch {
				// The map is already removed when the whole map unmounts.
			}
			appliedRef.current = NO_STATES
		}
	}, [key, loaded, map, source, sourceLayer])

	useEffect(() => {
		if (!map || !loaded) {
			return
		}
		const applied = appliedRef.current
		try {
			for (const id of applied.keys()) {
				if (!states.has(id)) {
					map.removeFeatureState({ source, sourceLayer, id }, key)
				}
			}
			for (const [id, value] of states) {
				if (applied.get(id) !== value) {
					map.setFeatureState(
						{ source, sourceLayer, id },
						{ [key]: value },
					)
				}
			}
		} catch (error) {
			console.warn(`Failed to update the ${key} feature state:`, error)
		}
		appliedRef.current = states
	}, [key, loaded, map, source, sourceLayer, states])
}
