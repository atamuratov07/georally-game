import type { CountryId } from '@georally/game-domain'
import type { BorderGraph } from '@georally/game-domain/borders'
import bordersJson from '../generated/borders.json'
import type { BordersPayload } from './types'

export function buildBorderGraph(payload: BordersPayload): BorderGraph {
	const graph: Record<CountryId, CountryId[]> = {}
	for (const [a, b] of payload.edges) {
		;(graph[a] ??= []).push(b)
		;(graph[b] ??= []).push(a)
	}
	for (const neighbours of Object.values(graph)) neighbours.sort()
	return graph
}

export const borderGraph = buildBorderGraph(bordersJson as BordersPayload)
