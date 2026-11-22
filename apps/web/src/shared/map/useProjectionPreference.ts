import { useCallback, useState } from 'react'
import type { ProjectionKind } from './ProjectionToggle'

const STORAGE_KEY = 'georally.map.projection'

function readProjection(): ProjectionKind {
	try {
		return window.localStorage.getItem(STORAGE_KEY) === 'globe'
			? 'globe'
			: 'flat'
	} catch {
		return 'flat'
	}
}

export function useProjectionPreference() {
	const [projection, setProjection] = useState(readProjection)

	const changeProjection = useCallback((next: ProjectionKind) => {
		setProjection(next)
		try {
			window.localStorage.setItem(STORAGE_KEY, next)
		} catch {
			return
		}
	}, [])

	return [projection, changeProjection] as const
}
