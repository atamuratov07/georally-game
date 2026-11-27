import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'
import { SINGLEPLAYER_MODES } from './modes'
import { singleplayerPaths } from './paths'
import { RedirectWithSearch } from './RedirectWithSearch'
import { dailyPaths } from './routes/daily/paths'
import { GameLoader } from './shared/components/GameLoader'

const defaultPaths = singleplayerPaths(SINGLEPLAYER_MODES[0].id)
const DailyPage = lazy(() => import('./routes/daily/DailyPage'))
const DailyGamePage = lazy(() => import('./routes/daily/DailyGamePage'))

export const singleplayerRoutes: RouteObject[] = [
	{
		path: 'singleplayer',
		element: <RedirectWithSearch to={defaultPaths.setup} />,
	},
	{
		path: 'singleplayer/play',
		element: <RedirectWithSearch to={defaultPaths.play} />,
	},
	...SINGLEPLAYER_MODES.flatMap(({ id, SetupPage, GamePage }) => {
		const paths = singleplayerPaths(id)
		return [
			{ path: paths.setup.slice(1), element: <SetupPage /> },
			{
				path: paths.play.slice(1),
				element: (
					<Suspense fallback={<GameLoader mode={id} />}>
						<GamePage />
					</Suspense>
				),
			},
		]
	}),
	{ path: dailyPaths.page.slice(1), element: <DailyPage /> },
	{
		path: dailyPaths.play.slice(1),
		element: (
			<Suspense
				fallback={<GameLoader mode='routes' leaveTo={dailyPaths.page} />}
			>
				<DailyGamePage />
			</Suspense>
		),
	},
]
