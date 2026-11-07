import type { FilterSpecification } from 'maplibre-gl'
import { useMemo } from 'react'
import { Layer } from 'react-map-gl/maplibre'
import { useCurrentLocale } from '../../../app/LocaleContext'
import {
	buildCapitalLabelLayer,
	buildCountryLabelLayer,
	buildGeolinesLablelLayer,
	capitalDotLayer,
} from '../map-styles'

interface LabelLayersProps {
	countryIds: readonly string[]
}

export function LabelLayers({ countryIds }: LabelLayersProps) {
	const language = useCurrentLocale()

	const geolinesLabelLayer = useMemo(
		() => buildGeolinesLablelLayer(language),
		[language],
	)
	const capitalLabelLayer = useMemo(
		() => buildCapitalLabelLayer(language),
		[language],
	)
	const countryLabelLayer = useMemo(
		() => buildCountryLabelLayer(language),
		[language],
	)

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
			<Layer {...capitalDotLayer} filter={filter} />
			<Layer {...capitalLabelLayer} filter={filter} />
			<Layer {...countryLabelLayer} filter={filter} />
		</>
	)
}
