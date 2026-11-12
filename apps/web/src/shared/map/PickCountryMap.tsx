import { memo, useCallback, useMemo, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { BaseMap } from './BaseMap'
import { useRevealCamera } from './camera/useRevealCamera'
import { useScopeCamera } from './camera/useScopeCamera'
import { CardToggle } from './CardToggle'
import { ProjectionToggle, type ProjectionKind } from './ProjectionToggle'
import { useCountryPicking } from './interaction/useCountryPicking'
import { CountryLayers } from './layers/CountryLayers'
import { LabelLayers } from './layers/LabelLayers'
import { MapMarkers } from './MapMarkers'
import { RevealPopup } from './RevealPopup'
import type { MapHighlight, MapMarker, PickCountryMapProps } from './types'

const NO_HIGHLIGHTS: readonly MapHighlight[] = []
const NO_MARKERS: readonly MapMarker[] = []

function PickCountryMapInner({
	onPick,
	interactiveIds,
	scope,
	highlights = NO_HIGHLIGHTS,
	markers = NO_MARKERS,
	revealTarget = null,
	popupElement = null,
	disabled = false,
	className,
	resetViewKey = null,
	onReady,
}: PickCountryMapProps) {
	const mapRef = useRef<MapRef | null>(null)
	const [isLoaded, setIsLoaded] = useState(false)
	const [isCardHidden, setIsCardHidden] = useState(false)

	const { pointerProps, clearHover } = useCountryPicking({
		mapRef,
		isLoaded,
		disabled,
		interactiveIds,
		highlights,
		onPick,
	})
	const { isSettled, unsettle } = useRevealCamera({
		mapRef,
		isLoaded,
		target: revealTarget,
	})
	const handleReset = useCallback(() => {
		clearHover()
		unsettle()
	}, [clearHover, unsettle])
	const { allowGlobe, maxBounds } = useScopeCamera({
		mapRef,
		isLoaded,
		scope,
		resetViewKey,
		onReset: handleReset,
	})

	const revealCountryId = revealTarget?.countryId ?? null
	const labelIds = useMemo(() => {
		const ids = new Set(
			highlights
				.filter(highlight => highlight.tone !== 'selected')
				.map(highlight => highlight.countryId),
		)
		if (revealCountryId) {
			ids.add(revealCountryId)
		}
		return [...ids]
	}, [highlights, revealCountryId])

	const [chosenProjection, setChosenProjection] =
		useState<ProjectionKind>('flat')
	const projection = allowGlobe ? chosenProjection : 'flat'
	const handleLoad = useCallback(() => {
		setIsLoaded(true)
		onReady?.()
	}, [onReady])
	const showCard = Boolean(popupElement) && revealTarget !== null && isSettled

	return (
		<BaseMap
			mapRef={mapRef}
			projection={projection}
			maxBounds={maxBounds}
			onLoad={handleLoad}
			className={className}
			overlays={
				<>
					<ProjectionToggle
						className='absolute top-3 left-3 z-10'
						value={projection}
						globeDisabled={!allowGlobe}
						onChange={next => {
							clearHover()
							setChosenProjection(next)
						}}
					/>
					{showCard ? (
						<CardToggle
							className='absolute top-15 right-3 z-10'
							hidden={isCardHidden}
							onHiddenChange={setIsCardHidden}
						/>
					) : null}
				</>
			}
			{...pointerProps}
		>
			<CountryLayers
				interactiveIds={interactiveIds}
				highlights={highlights}
			/>
			<LabelLayers countryIds={labelIds} />
			<MapMarkers markers={markers} />
			{showCard ? (
				<RevealPopup target={revealTarget} hidden={isCardHidden}>
					{popupElement}
				</RevealPopup>
			) : null}
		</BaseMap>
	)
}

export const PickCountryMap = memo(PickCountryMapInner)
PickCountryMap.displayName = 'PickCountryMap'
