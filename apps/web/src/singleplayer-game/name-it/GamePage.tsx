import {
	getCorrectCount,
	getQuestionCount,
	getScore,
} from '@georally/game-domain/singleplayer/name-it'
import type { PointerEvent } from 'react'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import { useDocumentScrollLock } from '@/shared/lib/useDocumentScrollLock'
import { WATER_FILL } from '@/shared/map/map-styles'
import { singleplayerPaths } from '../paths'
import { RedirectWithSearch } from '../RedirectWithSearch'
import { GameErrorBoundary } from '../shared/components/GameErrorBoundary'
import { GameErrorScreen } from '../shared/components/GameErrorScreen'
import { GameResultModal } from '../shared/components/GameResultModal'
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

function keepInputFocus(event: PointerEvent<HTMLElement>) {
	if ((event.target as Element).closest('button')) {
		event.preventDefault()
	}
}

function GameContent() {
	const navigate = useLocalizedNavigate()
	useDocumentScrollLock()
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
		<div
			className='fixed inset-0 touch-none overflow-hidden'
			style={{ backgroundColor: WATER_FILL }}
			onPointerDownCapture={keepInputFocus}
		>
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
				score={getScore(engineState)}
				correctCount={getCorrectCount(engineState)}
				totalCount={getQuestionCount(engineState)}
				onTryAgain={playAgain}
				onHome={() => {
					leave()
					navigate('/')
				}}
			/>
		</div>
	)
}
