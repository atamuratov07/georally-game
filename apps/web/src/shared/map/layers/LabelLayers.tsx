import type { FilterSpecification } from 'maplibre-gl'
import { useMemo } from 'react'
import { Layer } from 'react-map-gl/maplibre'
import { useCurrentLocale } from '../../../app/LocaleContext'
import {
	buildCapitalLabelLayer,
	buildCountryLabelLayer,
	buildGeolinesLablelLayer,
	buildSeaLabelLayer,
	capitalDotLayer,
} from '../map-styles'

interface LabelLayersProps {
	countryIds: readonly string[]
	namesAbovePoint?: boolean
}

export function LabelLayers({ countryIds, namesAbovePoint }: LabelLayersProps) {
	const language = useCurrentLocale()

	const geolinesLabelLayer = useMemo(
		() => buildGeolinesLablelLayer(language),
		[language],
	)
	const seaLabelLayer = useMemo(() => buildSeaLabelLayer(language), [language])
	const capitalLabelLayer = useMemo(
		() => buildCapitalLabelLayer(language),
		[language],
	)
	const countryLabelLayer = useMemo(() => {
		const layer = buildCountryLabelLayer(language)
		return namesAbovePoint
			? {
					...layer,
					layout: {
						...layer.layout,
						'text-anchor': 'bottom' as const,
						'text-offset': [0, -0.6] as [number, number],
					},
				}
			: layer
	}, [language, namesAbovePoint])

	const filter = useMemo<FilterSpecification>(
		() =>
			countryIds.length
				? ['in', ['get', 'iso_n3'], ['literal', [...countryIds]]]
				: ['==', ['get', 'iso_n3'], '__none__'],
		[countryIds],
	)

	return (
		<>
			<Layer {...geolinesLabelLayer} />
			<Layer {...seaLabelLayer} />
			<Layer {...capitalDotLayer} filter={filter} />
			<Layer {...capitalLabelLayer} filter={filter} />
			<Layer {...countryLabelLayer} filter={filter} />
		</>
	)
}
