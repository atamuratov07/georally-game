import type { CountryId } from '../shared/types'

export type BorderGraph = Readonly<Record<CountryId, readonly CountryId[]>>

export type BorderLink = readonly [from: CountryId, to: CountryId]

export interface RouteDistances {
	fromStart: ReadonlyMap<CountryId, number>
	toTarget: ReadonlyMap<CountryId, number>
	shortest: number
}
