import { normalizeCountryId } from '@georally/country-catalog'
import type { GameContinent, GameScope } from '@georally/game-domain'
import { Globe, Info, Map as MapIcon } from 'lucide-react'
import type { FilterSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, {
	Layer,
	Marker,
	NavigationControl,
	Popup,
	type ErrorEvent,
	type MapLayerMouseEvent,
	type MapRef,
	type ProjectionSpecification,
} from 'react-map-gl/maplibre'
import {
	Toggle as TogglePrimitive,
	ToggleGroup as ToggleGroupPrimitive,
} from 'radix-ui'
import { cn } from '../utils'
import { CONTINENT_VIEW_PRESETS } from './continent-view'
import {
	BASE_STYLE_LAYER_ID,
	buildCapitalLabelLayer,
	buildCountryLabelLayer,
	buildDimLayer,
	buildGeolinesLablelLayer,
	buildHighlightLayer,
	buildSelectionFillLayer,
	buildSelectionLineLayer,
	capitalDotLayer,
	hoverLayer,
	LABELS_BOTTOM_LAYER_ID,
	SOURCE_ID,
	SOURCE_LAYER_ID,
} from './map-styles'
import type { MapRendererProps } from './types'
import { useTranslation } from 'react-i18next'

import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useCurrentLocale } from '../../app/LocaleContext'

// Set worker URL for MapLibre v6
setWorkerUrl(workerUrl)

const MAP_STYLE_URL = '/map/style.json'

const DEFAULT_MAP_CENTER: [number, number] = [8, 18]
const DEFAULT_MAP_ZOOM = 2
const REVEALED_MAP_ZOOM = 3.4
const REVEALED_FLY_DURATION_MS = 900
const REVEALED_FLY_OFFSET: [number, number] = [0, 120]
const REVEALED_POPUP_OFFSET = 12

const INITIAL_VIEW_STATE = {
	longitude: DEFAULT_MAP_CENTER[0],
	latitude: DEFAULT_MAP_CENTER[1],
	zoom: DEFAULT_MAP_ZOOM,
}

const MAP_STYLE = { width: '100%', height: '100%' }

const INTERACTIVE_LAYER_IDS = [BASE_STYLE_LAYER_ID]

const transformRequest = (url: string) => {
	const absoluteUrl = url.startsWith('/')
		? new URL(url, window.location.origin).toString()
		: url
	return { url: absoluteUrl }
}

const MERCATOR_PROJECTION: ProjectionSpecification = { type: 'mercator' }
const GLOBE_PROJECTION: ProjectionSpecification = {
	type: 'vertical-perspective',
}

const isContinentScope = (scope: GameScope): scope is GameContinent => {
	return scope !== 'all'
}

function hasWrongHighlight(
	countryId: string,
	highlights: NonNullable<MapRendererProps['highlights']>,
): boolean {
	return highlights.some(highlight => {
		return highlight.countryId === countryId && highlight.tone === 'wrong'
	})
}

function mapControlClass(isCurrent: boolean): string {
	return cn(
		'grid size-11 place-items-center rounded-control border-2 transition-[translate,box-shadow,background-color,color] duration-150',
		'disabled:cursor-not-allowed disabled:opacity-45',
		isCurrent
			? 'translate-y-1 cursor-default border-line-strong bg-paper-deep text-muted'
			: [
					'border-ocean-600 bg-ocean-500 text-white shadow-[0_4px_0_0_var(--color-ocean-700)]',
					'enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_6px_0_0_var(--color-ocean-700)]',
					'enabled:active:translate-y-1 enabled:active:shadow-none',
				],
	)
}

function MapRendererInner({
	onPick,
	interactiveIds,
	scope,
	highlights = [],
	markers = [],
	revealTarget = null,
	popupElement = null,
	disabled = false,
	className,
	resetViewKey = null,
}: MapRendererProps) {
	const { t } = useTranslation()
	const language = useCurrentLocale()
	const mapRef = useRef<MapRef | null>(null)

	const [isLoaded, setIsLoaded] = useState(false)
	const [hasFailure, setHasFailure] = useState(false)
	const [mapProjection, setMapProjection] =
		useState<ProjectionSpecification>(MERCATOR_PROJECTION)
	const [isRevealSettled, setIsRevealSettled] = useState(false)
	const [isCardHidden, setIsCardHidden] = useState(false)
	const [continentMinZoom, setContinentMinZoom] = useState<number | undefined>(
		undefined,
	)

	// Scope =================================================

	const isContinentChosen = isContinentScope(scope)
	const activePreset = isContinentChosen ? CONTINENT_VIEW_PRESETS[scope] : null

	useEffect(() => {
		if (isContinentChosen) {
			setMapProjection(MERCATOR_PROJECTION)
		}
	}, [isContinentChosen])

	useEffect(() => {
		const map = mapRef.current?.getMap()
		if (!map || !isLoaded) {
			return
		}

		if (!activePreset) {
			setContinentMinZoom(undefined)
			return
		}

		const camera = map.cameraForBounds(activePreset.focusBounds, {
			padding: activePreset.padding,
		})
		if (!camera) {
			return
		}

		setContinentMinZoom(camera.zoom)
		map.easeTo({
			center: camera.center,
			zoom: camera.zoom,
			duration: 800,
			essential: true,
		})
	}, [activePreset, isLoaded])

	// Hover =================================================

	const hoveredFeatureIdRef = useRef<string | null>(null)

	const setFeatureHoverState = useCallback(
		(countryId: string, hover: boolean) => {
			const map = mapRef.current?.getMap()
			if (!map) {
				return
			}

			try {
				map.setFeatureState(
					{
						source: SOURCE_ID,
						sourceLayer: SOURCE_LAYER_ID,
						id: countryId,
					},
					{ hover },
				)
			} catch (error) {
				console.warn('Failed to update hover state:', error)
			}
		},
		[],
	)

	const clearHover = useCallback(() => {
		const previousId = hoveredFeatureIdRef.current
		if (!previousId) {
			return
		}

		setFeatureHoverState(previousId, false)
		hoveredFeatureIdRef.current = null
	}, [setFeatureHoverState])

	useEffect(() => {
		if (disabled) {
			clearHover()
		}
	}, [clearHover, disabled])

	useEffect(() => {
		return () => {
			clearHover()
		}
	}, [clearHover])

	// Popup ================================================

	useEffect(() => {
		if (!revealTarget || !isLoaded) {
			setIsRevealSettled(false)
			return
		}

		const map = mapRef.current?.getMap()
		if (!map) {
			setIsRevealSettled(true)
			return
		}

		setIsRevealSettled(false)
		let handled = false
		const finalizePopup = () => {
			if (handled) {
				return
			}

			handled = true
			setIsRevealSettled(true)
		}

		const handleMoveEnd = () => {
			finalizePopup()
			map.off('moveend', handleMoveEnd)
		}

		map.on('moveend', handleMoveEnd)
		const popupRevealTimer = setTimeout(() => {
			finalizePopup()
			map.off('moveend', handleMoveEnd)
		}, REVEALED_FLY_DURATION_MS + 120)

		map.easeTo({
			essential: true,
			center: [revealTarget.longitude, revealTarget.latitude],
			zoom: Math.max(map.getZoom(), REVEALED_MAP_ZOOM),
			offset: REVEALED_FLY_OFFSET,
			duration: REVEALED_FLY_DURATION_MS,
			easing: t => 1 - (1 - t) ** 3,
		})

		return () => {
			clearTimeout(popupRevealTimer)
			map.off('moveend', handleMoveEnd)
		}
	}, [isLoaded, revealTarget])

	useEffect(() => {
		setIsCardHidden(false)
	}, [revealTarget?.countryId])

	// Layers ================================================

	const selectedId =
		highlights.find(highlight => highlight.tone === 'selected')?.countryId ??
		null

	const highlightLayer = useMemo(() => {
		return buildHighlightLayer(highlights, selectedId)
	}, [highlights, selectedId])

	const selectionFillLayer = useMemo(
		() => buildSelectionFillLayer(selectedId, selectedId !== null),
		[selectedId],
	)

	const selectionLineLayer = useMemo(
		() => buildSelectionLineLayer(selectedId, selectedId !== null),
		[selectedId],
	)

	const dimLayer = useMemo(() => {
		return buildDimLayer(interactiveIds, true)
	}, [interactiveIds])

	const countryLabelLayer = useMemo(
		() => buildCountryLabelLayer(language),
		[language],
	)

	const capitalLabelLayer = useMemo(
		() => buildCapitalLabelLayer(language),
		[language],
	)

	const geolinesLabelLayer = useMemo(
		() => buildGeolinesLablelLayer(language),
		[language],
	)

	const labelIds = useMemo(() => {
		const ids = new Set<string>(
			highlights
				.filter(highlight => highlight.tone !== 'selected')
				.map(highlight => highlight.countryId),
		)
		if (revealTarget?.countryId) {
			ids.add(revealTarget.countryId)
		}
		return [...ids]
	}, [highlights, revealTarget?.countryId])

	const labelFilter = useMemo<FilterSpecification>(() => {
		if (!labelIds.length) {
			return ['==', ['to-string', ['get', 'ISO_N3']], '__none__']
		}

		return ['in', ['to-string', ['get', 'ISO_N3']], ['literal', labelIds]]
	}, [labelIds])

	// Handlers ================================================

	const handleMapClick = useCallback(
		(event: MapLayerMouseEvent) => {
			if (disabled || !isLoaded) {
				return
			}

			const rawId = event.features?.[0]?.id
			const pickedId =
				rawId === null || rawId === undefined
					? ''
					: normalizeCountryId(rawId)

			clearHover()
			if (
				!pickedId ||
				!interactiveIds.has(pickedId) ||
				hasWrongHighlight(pickedId, highlights)
			) {
				return
			}

			onPick(pickedId)
		},
		[clearHover, disabled, interactiveIds, isLoaded, highlights, onPick],
	)

	const handleMouseMove = useCallback(
		(event: MapLayerMouseEvent) => {
			const rawId = event.features?.[0]?.id
			const hoveredId =
				rawId === null || rawId === undefined
					? null
					: normalizeCountryId(rawId)

			const prevId = hoveredFeatureIdRef.current
			if (prevId === hoveredId) {
				return
			}

			if (prevId) {
				setFeatureHoverState(prevId, false)
				hoveredFeatureIdRef.current = null
			}

			if (
				!disabled &&
				hoveredId &&
				interactiveIds.has(hoveredId) &&
				!hasWrongHighlight(hoveredId, highlights)
			) {
				setFeatureHoverState(hoveredId, true)
				hoveredFeatureIdRef.current = hoveredId
			}
		},
		[disabled, highlights, interactiveIds, setFeatureHoverState],
	)

	// Projection ================================================

	const projectionType =
		typeof mapProjection.type === 'string' ? mapProjection.type : ''
	const isMercatorProjection = projectionType === 'mercator'
	const isGlobeProjection =
		projectionType === 'globe' || projectionType === 'vertical-perspective'
	const isProjectionSwitchingRef = useRef(false)

	const switchProjection = useCallback(
		(projection: ProjectionSpecification) => {
			const map = mapRef.current?.getMap()
			clearHover()
			isProjectionSwitchingRef.current = true
			setMapProjection(projection)

			if (map) {
				map.once('idle', () => {
					isProjectionSwitchingRef.current = false
				})
			} else {
				setTimeout(() => {
					isProjectionSwitchingRef.current = false
				}, 300)
			}
		},
		[clearHover],
	)

	// Map ======================================================

	const handleLoad = useCallback(() => {
		setIsLoaded(true)
		// MapLibre opens compact attribution expanded until the first move; start
		// it collapsed so it does not sit under the bottom action button.
		mapRef.current
			?.getContainer()
			.querySelector('.maplibregl-ctrl-attrib')
			?.classList.remove('maplibregl-compact-show')
	}, [])
	const handleError = useCallback((event: ErrorEvent) => {
		console.error('Maplibre error:', event.error)
		setTimeout(() => setHasFailure(true), 0)
	}, [])

	const resetView = useCallback(
		(duration = 650) => {
			const map = mapRef.current
			if (!map || !isLoaded) {
				return
			}

			clearHover()
			setIsRevealSettled(false)

			if (activePreset) {
				const camera = map.cameraForBounds(activePreset.focusBounds, {
					padding: activePreset.padding,
				})

				if (!camera) {
					return
				}

				setContinentMinZoom(camera.zoom)
				map.easeTo({
					essential: true,
					center: camera.center,
					zoom: camera.zoom,
					bearing: 0,
					pitch: 0,
					offset: [0, 0],
					duration,
				})
				return
			}

			setContinentMinZoom(undefined)
			map.easeTo({
				essential: true,
				center: DEFAULT_MAP_CENTER,
				zoom: DEFAULT_MAP_ZOOM,
				bearing: 0,
				pitch: 0,
				offset: [0, 0],
				duration,
			})
		},
		[activePreset, clearHover, isLoaded],
	)

	const previousResetViewKeyRef = useRef(resetViewKey)

	useEffect(() => {
		if (
			!isLoaded ||
			resetViewKey === null ||
			resetViewKey === undefined ||
			resetViewKey === previousResetViewKeyRef.current
		) {
			return
		}

		previousResetViewKeyRef.current = resetViewKey
		const resetTimer = setTimeout(resetView, 0)

		return () => {
			clearTimeout(resetTimer)
		}
	}, [isLoaded, resetViewKey, resetView])

	return (
		<div
			className={`relative h-full w-full overflow-hidden ${isGlobeProjection ? 'bg-ocean-900' : ''} ${className}`}
		>
			<Map
				ref={mapRef}
				attributionControl={{ compact: true }}
				initialViewState={INITIAL_VIEW_STATE}
				mapStyle={MAP_STYLE_URL}
				style={MAP_STYLE}
				maxBounds={activePreset?.maxBounds}
				minZoom={activePreset ? continentMinZoom : undefined}
				projection={mapProjection}
				onLoad={handleLoad}
				transformRequest={transformRequest}
				onClick={handleMapClick}
				onMouseMove={handleMouseMove}
				onMouseLeave={clearHover}
				interactiveLayerIds={INTERACTIVE_LAYER_IDS}
				onError={handleError}
			>
				<NavigationControl showCompass={false} position='top-left' />

				<Layer {...dimLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
				<Layer {...highlightLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
				<Layer {...selectionFillLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
				<Layer {...selectionLineLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
				<Layer {...hoverLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
				<Layer {...geolinesLabelLayer} />
				<Layer {...capitalDotLayer} filter={labelFilter} />
				<Layer {...capitalLabelLayer} filter={labelFilter} />
				<Layer {...countryLabelLayer} filter={labelFilter} />

				{markers.map(marker => (
					<Marker
						key={marker.id}
						longitude={marker.longitude}
						latitude={marker.latitude}
						anchor={marker.anchor ?? 'bottom'}
					>
						<div className='pointer-events-none'>{marker.element}</div>
					</Marker>
				))}

				{revealTarget && popupElement && isRevealSettled ? (
					<Popup
						longitude={revealTarget.longitude}
						latitude={revealTarget.latitude}
						offset={REVEALED_POPUP_OFFSET}
						className='revealed-popup'
						maxWidth='none'
						closeOnClick={false}
						closeButton={false}
					>
						<div
							className={`transition-all duration-200 ease-out ${
								isCardHidden
									? 'pointer-events-none scale-95 opacity-0'
									: 'scale-100 opacity-100'
							}`}
						>
							{popupElement}
						</div>
					</Popup>
				) : null}
			</Map>

			{popupElement && isRevealSettled ? (
				<div className='absolute top-15 right-3 z-10'>
					<TogglePrimitive.Root
						aria-label={t('map.info.show')}
						title={isCardHidden ? t('map.info.show') : t('map.info.hide')}
						pressed={!isCardHidden}
						onPressedChange={pressed => setIsCardHidden(!pressed)}
						className={mapControlClass(!isCardHidden)}
					>
						<Info
							aria-hidden='true'
							className='size-6'
							strokeWidth={2.25}
						/>
					</TogglePrimitive.Root>
				</div>
			) : null}

			<ToggleGroupPrimitive.Root
				type='single'
				orientation='vertical'
				className='absolute top-3 left-3 z-10 flex flex-col gap-2'
				value={isGlobeProjection ? 'globe' : 'flat'}
				onValueChange={value => {
					if (value === 'flat' && !isMercatorProjection) {
						switchProjection(MERCATOR_PROJECTION)
					} else if (value === 'globe' && !isGlobeProjection) {
						switchProjection(GLOBE_PROJECTION)
					}
				}}
			>
				<ToggleGroupPrimitive.Item
					value='flat'
					aria-label={t('map.projection.flat')}
					title={t('map.projection.flat')}
					className={mapControlClass(isMercatorProjection)}
				>
					<MapIcon
						aria-hidden='true'
						className='size-6'
						strokeWidth={2.25}
					/>
				</ToggleGroupPrimitive.Item>
				<ToggleGroupPrimitive.Item
					value='globe'
					aria-label={t('map.projection.globe')}
					title={t('map.projection.globe')}
					disabled={isContinentChosen}
					className={mapControlClass(isGlobeProjection)}
				>
					<Globe
						aria-hidden='true'
						className='size-6'
						strokeWidth={2.25}
					/>
				</ToggleGroupPrimitive.Item>
			</ToggleGroupPrimitive.Root>

			{hasFailure ? (
				<div
					role='alert'
					className='absolute top-3 left-1/2 z-11 -translate-x-1/2 rounded-full border-2 border-coral-600 bg-coral-500 px-4 py-1.5 text-sm font-extrabold text-white'
				>
					{t('map.error')}
				</div>
			) : null}
		</div>
	)
}

export const MapRenderer = memo(MapRendererInner)
MapRenderer.displayName = 'MapRenderer'
