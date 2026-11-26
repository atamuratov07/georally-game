import { createContext } from 'react'
import { singleplayerPaths } from '../paths'

export const RouteLeaveTarget = createContext(singleplayerPaths('routes').setup)
