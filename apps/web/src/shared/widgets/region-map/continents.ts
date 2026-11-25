import { REGION_PATHS } from 'virtual:region-map'

export type Continent = keyof typeof REGION_PATHS

export const CONTINENTS = Object.keys(REGION_PATHS) as Continent[]

export const CONTINENT_COLORS: Record<
	Continent,
	{ face: string; edge: string; chip: string }
> = {
	africa: {
		face: 'fill-[#ff9a1f]',
		edge: 'fill-[#d9690a]',
		chip: 'bg-[#d9690a]',
	},
	asia: {
		face: 'fill-[#ff4f6d]',
		edge: 'fill-[#c92143]',
		chip: 'bg-[#c92143]',
	},
	europe: {
		face: 'fill-[#3d8bff]',
		edge: 'fill-[#1f5bd6]',
		chip: 'bg-[#1f5bd6]',
	},
	'north-america': {
		face: 'fill-[#3fd15c]',
		edge: 'fill-[#20963a]',
		chip: 'bg-[#20963a]',
	},
	'south-america': {
		face: 'fill-[#a45cff]',
		edge: 'fill-[#7432d9]',
		chip: 'bg-[#7432d9]',
	},
	oceania: {
		face: 'fill-[#1fcfc8]',
		edge: 'fill-[#0b918c]',
		chip: 'bg-[#0b918c]',
	},
}

export interface RegionOption<Region extends string> {
	value: Region
	continents: readonly Continent[]
}
