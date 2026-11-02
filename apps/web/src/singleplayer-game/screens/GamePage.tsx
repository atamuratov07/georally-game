import {
	getCorrectCount,
	getQuestionCount,
	getScore,
	type GameConfig,
} from '@georally/game-domain/singleplayer'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, ButtonLink, ScreenShell, SurfacePanel } from '../../shared/ui'
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
			<ScreenShell center className='px-5 py-8'>
				<SurfacePanel>
					<p className='text-[11px] font-black uppercase tracking-[0.22em] text-rose-700'>
						{t('singleplayer.title')}
					</p>
					<h1 className='mt-3 text-3xl font-black tracking-tight text-slate-950'>
						{t('singleplayer.unavailableTitle')}
					</h1>
					<p className='mt-3 text-sm leading-7 text-slate-600'>
						{t(getLoadErrorKey(loadErrorCode))}
					</p>
					<div className='mt-6 flex flex-wrap gap-3'>
						<Button type='button' variant='teal' onClick={handleTryAgain}>
							{t('common.retry')}
						</Button>
						<ButtonLink to='/singleplayer' variant='secondary'>
							{t('singleplayer.changeSettings')}
						</ButtonLink>
					</div>
				</SurfacePanel>
			</ScreenShell>
		)
	}

	return (
		<div className='fixed inset-0 overflow-hidden bg-slate-950'>
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
