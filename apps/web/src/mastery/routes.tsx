import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { masteryPaths } from './paths'

const MasteryHomePage = lazy(() => import('./home/MasteryHomePage'))
const MasterySessionPage = lazy(() => import('./session/MasterySessionPage'))

export const masteryRoutes: RouteObject[] = [
	{ path: masteryPaths.home.slice(1), element: <MasteryHomePage /> },
	{ path: masteryPaths.play.slice(1), element: <MasterySessionPage /> },
]
