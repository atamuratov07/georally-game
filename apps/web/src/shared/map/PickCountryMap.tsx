import { memo, useCallback, useMemo, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { BaseMap } from './BaseMap'
import { useRevealCamera } from './camera/useRevealCamera'
import { useScopeCamera } from './camera/useScopeCamera'
import { CardToggle } from './CardToggle'
import { useCountryPicking } from './interaction/useCountryPicking'
import { CountryLayers } from './layers/CountryLayers'
import { LabelLayers } from './layers/LabelLayers'
import { MapMarkers } from './MapMarkers'
import { RevealPopup } from './RevealPopup'
import type {
	MapHighlight,
	MapMarker,
	PickCountryMapProps,
	MapRevealTarget,
} from './types'

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
}: PickCountryMapProps) {
	const mapRef = useRef<MapRef | null>(null)
	const [isLoaded, setIsLoaded] = useState(false)
	const [hiddenCardTarget, setHiddenCardTarget] =
		useState<MapRevealTarget | null>(null)

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

	const handleLoad = useCallback(() => setIsLoaded(true), [])
	const showCard = Boolean(popupElement) && revealTarget !== null && isSettled
	const isCardHidden =
		revealTarget !== null && hiddenCardTarget === revealTarget

	return (
		<BaseMap
			mapRef={mapRef}
			allowGlobe={allowGlobe}
			maxBounds={maxBounds}
			onLoad={handleLoad}
			onProjectionChange={clearHover}
			className={className}
			overlays={
				showCard ? (
					<CardToggle
						hidden={isCardHidden}
						onHiddenChange={hidden =>
							setHiddenCardTarget(hidden ? revealTarget : null)
						}
					/>
				) : null
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
