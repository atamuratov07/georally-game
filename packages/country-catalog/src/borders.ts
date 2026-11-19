import { fromEdges } from '@georally/game-domain/borders'
import bordersJson from '../generated/borders.json'
import type { BordersPayload } from './types'

export const borderGraph = fromEdges((bordersJson as BordersPayload).edges)
