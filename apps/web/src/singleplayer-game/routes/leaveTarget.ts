import { createContext } from 'react'
import { singleplayerPaths } from '../paths'

export const RouteLeaveTarget = createContext<{ to: string; state?: unknown }>({
	to: singleplayerPaths('routes').setup,
})
