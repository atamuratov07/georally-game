import {
	getCorrectCount,
	getQuestionCount,
	getScore,
	type GameConfig,
} from '@georally/game-domain/singleplayer/locate'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapPinOff } from 'lucide-react'
import { LocalizedLink } from '@/app/LocalizedLink'
import { StatusScreen } from '@/shared/layout'
import { Button, TextButton } from '@/shared/ui'
import { GameResultModal } from '../components/GameResultModal'
import { parseGameConfig } from '../core/config'
import { useGameSession, type GameLoadErrorCode } from '../core/useGameSession'
import { GameScreen } from './GameScreen'
import { InvalidConfigScreen } from './InvalidConfigScreen'
import { useTranslation } from 'react-i18next'
import { useLocalizedNavigate } from '../../app/useLocalizedNavigate'

function getLoadErrorKey(errorCode: GameLoadErrorCode | null): string {
	if (errorCode === 'no_playable_countries') {
		return 'singleplayer.loadErrors.noPlayableCountries'
	}

	if (errorCode === 'no_eligible_countries') {
		return 'singleplayer.loadErrors.noEligibleCountries'
	}

	if (errorCode === 'insufficient_eligible_countries') {
		return 'singleplayer.loadErrors.insufficientEligibleCountries'
	}

	return 'singleplayer.loadErrors.default'
}

export default function GamePage() {
	const [searchParams] = useSearchParams()
	const configResult = useMemo(
		() => parseGameConfig(searchParams),
		[searchParams],
	)

	if (!configResult.ok) {
		return <InvalidConfigScreen />
	}
	return <GameContent config={configResult.value} />
}

function GameContent({ config }: { config: GameConfig }) {
	const { t } = useTranslation()
	const navigate = useLocalizedNavigate()
	const {
		gameData,
		loadErrorCode,
		engineState,
		eligibleIds,
		handleTryAgain,
		handlePick,
		handleGiveUp,
		handleNext,
	} = useGameSession(config)

	if (loadErrorCode || !gameData) {
		return (
			<StatusScreen
				tone='coral'
				icon={<MapPinOff />}
				title={t(getLoadErrorKey(loadErrorCode))}
				actions={
					<>
						<TextButton asChild>
							<LocalizedLink to='/singleplayer'>
								{t('singleplayer.changeSettings')}
							</LocalizedLink>
						</TextButton>
						<Button
							type='button'
							variant='ocean'
							onClick={handleTryAgain}
						>
							{t('common.retry')}
						</Button>
					</>
				}
			/>
		)
	}

	return (
		<div className='fixed inset-0 overflow-hidden'>
			<GameScreen
				state={engineState}
				eligibleIds={eligibleIds}
				countriesInfo={gameData.countriesById}
				onPick={handlePick}
				onGiveUp={handleGiveUp}
				onNext={handleNext}
			/>

			<GameResultModal
				open={engineState.phase === 'finished'}
				score={getScore(engineState)}
				correctCount={getCorrectCount(engineState)}
				totalCount={getQuestionCount(engineState)}
				onTryAgain={handleTryAgain}
				onHome={() => {
					navigate('/')
				}}
			/>
		</div>
	)
}
