import type { GameScope } from '@georally/game-domain'
import type { Attempt } from '@georally/game-domain/singleplayer/recall-sprint'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { BaseMap } from '@/shared/map/BaseMap'
import type { Overlays } from '@/shared/map/camera/framing'
import type { ProjectionKind } from '@/shared/map/ProjectionToggle'
import { RevealLayers, type Hit } from './RevealLayers'
import { regionViewState } from './sprintRegion'
import { PlayCamera } from './PlayCamera'
import { ReviewLayers } from './ReviewLayers'
import { useOverlayCamera } from './useOverlayCamera'

const MAX_ZOOM = 7
const ZOOM_AROUND_CENTER = { around: 'center' } as const

interface SprintMapProps {
	projection: ProjectionKind
	scope: GameScope
	countryIds: readonly string[]
	found: readonly string[]
	attempt: Attempt | null
	overlays: Overlays
	navigationTop: string | null
	review: SprintMapReview | null
	onReady: () => void
}

export interface SprintMapReview {
	activeId: string | null
	onSelect: (countryId: string | null) => void
}

const NO_IDS: ReadonlySet<string> = new Set()

function SprintMapInner({
	projection,
	scope,
	countryIds,
	found,
	attempt,
	overlays,
	navigationTop,
	review,
	onReady,
}: SprintMapProps) {
	const mapRef = useRef<MapRef | null>(null)
	const [isLoaded, setIsLoaded] = useState(false)
	const [initialViewState] = useState(() =>
		regionViewState(scope, overlays.padding),
	)
	const [restoredAttemptAt] = useState(attempt?.at ?? null)
	const [landedAt, setLandedAt] = useState<number | null>(null)
	const fresh = attempt && attempt.at !== restoredAttemptAt ? attempt : null
	const landed = fresh !== null && fresh.at === landedAt
	const regionIds = useMemo(() => new Set(countryIds), [countryIds])

	const held = useMemo(
		() => (fresh && !landed ? new Set(fresh.foundIds) : NO_IDS),
		[fresh, landed],
	)
	const revealedIds = useMemo(
		() => found.filter(countryId => !held.has(countryId)),
		[found, held],
	)
	const missedIds = useMemo(
		() => countryIds.filter(countryId => !found.includes(countryId)),
		[countryIds, found],
	)
	const labelIds = review ? missedIds : revealedIds
	const ringIds = review ? countryIds : revealedIds
	const hits = useMemo<Hit[]>(
		() =>
			fresh
				? [...(landed ? fresh.foundIds : []), ...fresh.repeatedIds].map(
						countryId => ({ key: `${fresh.at}:${countryId}`, countryId }),
					)
				: [],
		[fresh, landed],
	)

	const holdRef = useRef(false)
	const { overlaysRef, takenOverRef } = useOverlayCamera({
		mapRef,
		isLoaded,
		scope,
		overlays,
		holdRef,
	})

	const handleLoad = useCallback(() => {
		const map = mapRef.current?.getMap()
		if (map) {
			map.touchZoomRotate.disableRotation()
			map.getCanvas().removeAttribute('tabindex')
		}
		setIsLoaded(true)
		onReady()
	}, [onReady])

	return (
		<BaseMap
			mapRef={mapRef}
			initialViewState={initialViewState}
			projection={projection}
			onLoad={handleLoad}
			navigationTop={navigationTop}
			maxZoom={MAX_ZOOM}
			dragRotate={false}
			touchPitch={false}
			keyboard={false}
			scrollZoom={ZOOM_AROUND_CENTER}
			touchZoomRotate={ZOOM_AROUND_CENTER}
		>
			<RevealLayers
				loaded={isLoaded}
				regionIds={regionIds}
				revealedIds={revealedIds}
				ringIds={ringIds}
				labelIds={labelIds}
				hits={hits}
			/>
			{isLoaded && review ? (
				<ReviewLayers
					scope={scope}
					regionIds={regionIds}
					activeId={review.activeId}
					onSelect={review.onSelect}
					overlaysRef={overlaysRef}
					holdRef={holdRef}
					takenOverRef={takenOverRef}
				/>
			) : null}
			{isLoaded && !review ? (
				<PlayCamera
					attempt={fresh}
					overlaysRef={overlaysRef}
					holdRef={holdRef}
					onLanded={setLandedAt}
				/>
			) : null}
		</BaseMap>
	)
}

export const SprintMap = memo(SprintMapInner)
