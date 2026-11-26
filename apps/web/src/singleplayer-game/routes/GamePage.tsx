import {
	createIdleState,
	type RouteConfig,
} from '@georally/game-domain/singleplayer/routes'
import { useCallback, useState } from 'react'
import { singleplayerPaths } from '../paths'
import { RedirectWithSearch } from '../RedirectWithSearch'
import { GameErrorBoundary } from '../shared/components/GameErrorBoundary'
import { GameErrorScreen } from '../shared/components/GameErrorScreen'
import { KeyboardGameFrame } from '../shared/components/KeyboardGameFrame'
import { RoutesScreen } from './RoutesScreen'
import { routeGameStore } from './store'
import { useRoutesGame } from './useRoutesGame'

const paths = singleplayerPaths('routes')

export default function GamePage() {
	const [round, setRound] = useState(0)
	const playNext = useCallback((config: RouteConfig) => {
		routeGameStore.save(createIdleState(config))
		setRound(current => current + 1)
	}, [])

	return (
		<GameErrorBoundary
			fallback={<GameErrorScreen setupPath={paths.setup} />}
			onError={routeGameStore.clear}
		>
			<GameContent key={round} onNext={playNext} />
		</GameErrorBoundary>
	)
}

function GameContent({ onNext }: { onNext: (config: RouteConfig) => void }) {
	const { state, board, begin, attempt, hint, giveUp } =
		useRoutesGame(routeGameStore)

	if (state === null || board === null) {
		return <RedirectWithSearch to={paths.setup} />
	}

	const { config } = state

	return (
		<KeyboardGameFrame>
			<RoutesScreen
				state={state}
				board={board}
				onReady={begin}
				onAttempt={attempt}
				onHint={hint}
				onGiveUp={giveUp}
				onLeave={routeGameStore.clear}
				onNext={config.kind === 'practice' ? () => onNext(config) : null}
			/>
		</KeyboardGameFrame>
	)
}
