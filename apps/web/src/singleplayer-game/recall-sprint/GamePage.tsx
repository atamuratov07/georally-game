import { singleplayerPaths } from '../paths'
import { RedirectWithSearch } from '../RedirectWithSearch'
import { GameErrorBoundary } from '../shared/components/GameErrorBoundary'
import { GameErrorScreen } from '../shared/components/GameErrorScreen'
import { KeyboardGameFrame } from '../shared/components/KeyboardGameFrame'
import { SprintScreen } from './SprintScreen'
import { sprintGameStore } from './store'
import { useSprintGame } from './useSprintGame'

const paths = singleplayerPaths('recall-sprint')

export default function GamePage() {
	return (
		<GameErrorBoundary
			fallback={<GameErrorScreen setupPath={paths.setup} />}
			onError={sprintGameStore.clear}
		>
			<GameContent />
		</GameErrorBoundary>
	)
}

function GameContent() {
	const { engineState, begin, attempt, finish, leave } = useSprintGame()

	if (engineState === null) {
		return <RedirectWithSearch to={paths.setup} />
	}

	return (
		<KeyboardGameFrame>
			<SprintScreen
				state={engineState}
				onReady={begin}
				onAttempt={attempt}
				onFinish={finish}
				onLeave={leave}
			/>
		</KeyboardGameFrame>
	)
}
