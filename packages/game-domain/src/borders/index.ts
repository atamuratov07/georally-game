import type { CountryId } from '../shared/types'

export type BorderGraph = Readonly<Record<CountryId, readonly CountryId[]>>
