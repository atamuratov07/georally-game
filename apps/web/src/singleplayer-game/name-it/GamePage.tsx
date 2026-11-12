import {
	getCorrectCount,
	getQuestionCount,
	getScore,
} from '@georally/game-domain/singleplayer/name-it'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import { singleplayerPaths } from '../paths'
import { RedirectWithSearch } from '../RedirectWithSearch'
import { GameErrorBoundary } from '../shared/components/GameErrorBoundary'
import { GameErrorScreen } from '../shared/components/GameErrorScreen'
import { GameResultModal } from '../shared/components/GameResultModal'
import { KeyboardGameFrame } from '../shared/components/KeyboardGameFrame'
import { RoundScreen } from './RoundScreen'
import { nameItGameStore } from './store'
import { useNameItGame } from './useNameItGame'

const paths = singleplayerPaths('name-it')

export default function GamePage() {
	return (
		<GameErrorBoundary
			fallback={<GameErrorScreen setupPath={paths.setup} />}
			onError={nameItGameStore.clear}
		>
			<GameContent />
		</GameErrorBoundary>
	)
}

function GameContent() {
	const navigate = useLocalizedNavigate()
	const {
		engineState,
		upcomingTargetId,
		begin,
		answer,
		giveUp,
		next,
		playAgain,
		leave,
	} = useNameItGame()

	if (engineState === null) {
		return <RedirectWithSearch to={paths.setup} />
	}

	return (
		<KeyboardGameFrame>
			<RoundScreen
				state={engineState}
				upcomingTargetId={upcomingTargetId}
				onBegin={begin}
				onAnswer={answer}
				onGiveUp={giveUp}
				onNext={next}
			/>

			<GameResultModal
				open={engineState.phase === 'finished'}
				mode='name_it'
				score={getScore(engineState)}
				correctCount={getCorrectCount(engineState)}
				totalCount={getQuestionCount(engineState)}
				onTryAgain={playAgain}
				onHome={() => {
					leave()
					navigate('/')
				}}
			/>
		</KeyboardGameFrame>
	)
}
