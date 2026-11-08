import {
	createIdleState,
	type GameConfig,
} from '@georally/game-domain/singleplayer/locate'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import { useLocalizedSearchParams } from '@/app/useLocalizedSearchParams'
import { RegionPicker } from '@/shared/widgets/region-map/RegionPicker'
import {
	difficultyOptions,
	numberOptions,
} from '@/shared/widgets/settingOptions'
import { SettingToggleGroup } from '@/shared/widgets/SettingToggleGroup'
import { singleplayerPaths } from '../paths'
import { ResumeGameCard } from '../shared/components/ResumeGameCard'
import { SetupCard } from '../shared/components/SetupCard'
import { SetupShell } from '../shared/components/SetupShell'
import { fitQuestionCount } from '../shared/questionCountFit'
import { DIFFICULTY_OPTIONS } from '../shared/setupParams'
import {
	ATTEMPTS_PER_QUESTION_OPTIONS,
	QUESTION_COUNT_OPTIONS,
	readSetupConfig,
	toSearchParams,
} from './config'
import { locateGameStore } from './store'

const paths = singleplayerPaths('locate')

const prefetchGame = () => {
	void import('./GamePage')
}

function loadResumableGame() {
	const game = locateGameStore.load()
	return game?.phase === 'answering' || game?.phase === 'revealed'
		? game
		: null
}

export default function SetupPage() {
	const { t } = useTranslation()
	const navigate = useLocalizedNavigate()
	const [searchParams, setSearchParams] = useLocalizedSearchParams()
	const config = readSetupConfig(searchParams)
	const [saved, setSaved] = useState(loadResumableGame)

	const { eligibleCount, questionCount } = fitQuestionCount(
		config,
		QUESTION_COUNT_OPTIONS,
	)
	const playableConfig =
		questionCount === null ? null : { ...config, questionCount }

	useEffect(() => {
		const timer = setTimeout(prefetchGame, 500)
		return () => clearTimeout(timer)
	}, [])

	function update(patch: Partial<GameConfig>) {
		setSearchParams(toSearchParams({ ...config, ...patch }), {
			replace: true,
		})
	}

	function setupLink(): string {
		const url = new URL(window.location.href)
		url.search = toSearchParams(playableConfig ?? config).toString()
		return url.toString()
	}

	function handleStart() {
		if (!playableConfig) {
			return
		}

		locateGameStore.save(createIdleState(playableConfig))
		navigate(paths.play)
	}

	function handleDiscard() {
		locateGameStore.clear()
		setSaved(null)
	}

	if (saved) {
		return (
			<SetupShell mode='locate'>
				<ResumeGameCard
					current={saved.index + 1}
					answered={
						saved.phase === 'revealed' ? saved.index + 1 : saved.index
					}
					total={saved.questionIds.length}
					scope={saved.config.scope}
					difficulty={saved.config.difficulty}
					onResume={() => navigate(paths.play)}
					onDiscard={handleDiscard}
				/>
			</SetupShell>
		)
	}

	return (
		<SetupShell mode='locate'>
			<SetupCard
				mode='locate'
				copyLink={setupLink()}
				canStart={playableConfig !== null}
				eligibleCount={eligibleCount}
				onStart={handleStart}
				onPrefetch={prefetchGame}
			>
				<RegionPicker
					label={t('settings.region')}
					value={config.scope}
					onChange={scope => update({ scope })}
				/>
				<SettingToggleGroup
					label={t('settings.difficulty')}
					value={config.difficulty}
					options={difficultyOptions(t, DIFFICULTY_OPTIONS)}
					onChange={difficulty => update({ difficulty })}
				/>
				<div className='grid gap-6 sm:grid-cols-2'>
					<SettingToggleGroup
						label={t('settings.questions')}
						value={questionCount ?? config.questionCount}
						options={numberOptions(QUESTION_COUNT_OPTIONS).map(
							option => ({
								...option,
								disabled: option.value > eligibleCount,
							}),
						)}
						onChange={value => update({ questionCount: value })}
					/>
					<SettingToggleGroup
						label={t('settings.attempts')}
						tone='coral'
						value={config.attemptsPerQuestion}
						options={numberOptions(ATTEMPTS_PER_QUESTION_OPTIONS)}
						onChange={attemptsPerQuestion =>
							update({ attemptsPerQuestion })
						}
					/>
				</div>
			</SetupCard>
		</SetupShell>
	)
}
