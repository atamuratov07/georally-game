import { countryCatalog } from '@georally/country-catalog'
import {
	getCorrectCount,
	getQuestionCount,
	getScore,
} from '@georally/game-domain/singleplayer/locate'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import { singleplayerPaths } from '../paths'
import { RedirectWithSearch } from '../RedirectWithSearch'
import { GameErrorBoundary } from '../shared/components/GameErrorBoundary'
import { GameErrorScreen } from '../shared/components/GameErrorScreen'
import { GameResultModal } from '../shared/components/GameResultModal'
import { GameScreen } from './GameScreen'
import { locateGameStore } from './store'
import { useLocateGame } from './useLocateGame'

const paths = singleplayerPaths('locate')

export default function GamePage() {
	return (
		<GameErrorBoundary
			fallback={<GameErrorScreen setupPath={paths.setup} />}
			onError={locateGameStore.clear}
		>
			<GameContent />
		</GameErrorBoundary>
	)
}

function GameContent() {
	const navigate = useLocalizedNavigate()
	const {
		engineState,
		eligibleIds,
		handlePick,
		handleGiveUp,
		handleNext,
		handlePlayAgain,
		handleLeave,
	} = useLocateGame()

	if (engineState === null) {
		return <RedirectWithSearch to={paths.setup} />
	}

	return (
		<div className='fixed inset-0 overflow-hidden'>
			<GameScreen
				state={engineState}
				eligibleIds={eligibleIds}
				countriesInfo={countryCatalog.countriesById}
				onPick={handlePick}
				onGiveUp={handleGiveUp}
				onNext={handleNext}
			/>

			<GameResultModal
				open={engineState.phase === 'finished'}
				score={getScore(engineState)}
				correctCount={getCorrectCount(engineState)}
				totalCount={getQuestionCount(engineState)}
				onTryAgain={handlePlayAgain}
				onHome={() => {
					handleLeave()
					navigate('/')
				}}
			/>
		</div>
	)
}
