import type { CountryId } from '../shared/types'

export type BorderGraph = Readonly<Record<CountryId, readonly CountryId[]>>

export interface RouteDistances {
	fromStart: ReadonlyMap<CountryId, number>
	toTarget: ReadonlyMap<CountryId, number>
	/** Border crossings on a shortest path; par is one less. */
	shortest: number
}
