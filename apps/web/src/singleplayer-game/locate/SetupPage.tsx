import {
	createIdleState,
	type GameConfig,
} from '@georally/game-domain/singleplayer/locate'
import { Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import { useLocalizedSearchParams } from '@/app/useLocalizedSearchParams'
import { BackLink, PageShell } from '@/shared/layout'
import { Button, Card, CardHeader, CardTitle, CopyButton } from '@/shared/ui'
import { RegionPicker } from '@/shared/widgets/region-map/RegionPicker'
import {
	difficultyOptions,
	numberOptions,
} from '@/shared/widgets/settingOptions'
import { SettingToggleGroup } from '@/shared/widgets/SettingToggleGroup'
import { singleplayerPaths } from '../paths'
import { ResumeGameCard } from '../shared/components/ResumeGameCard'
import { fitQuestionCount } from '../shared/questionCountFit'
import {
	ATTEMPTS_PER_QUESTION_OPTIONS,
	DIFFICULTY_OPTIONS,
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
			<PageShell width='lg'>
				<BackLink to='/'>{t('common.home')}</BackLink>
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
			</PageShell>
		)
	}

	return (
		<PageShell width='lg'>
			<BackLink to='/'>{t('common.home')}</BackLink>
			<Card>
				<CardHeader className='flex-row items-center justify-between gap-3'>
					<CardTitle asChild>
						<h1>{t('singleplayer.title')}</h1>
					</CardTitle>
					<CopyButton
						size='sm'
						className='shrink-0'
						textToCopy={setupLink()}
						aria-label={t('singleplayer.copySetupLabel')}
					>
						<span className='hidden sm:inline'>
							{t('singleplayer.copySetup')}
						</span>
					</CopyButton>
				</CardHeader>

				<div className='flex flex-col gap-6'>
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
							onChange={questionCount => update({ questionCount })}
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
				</div>

				<Button
					type='button'
					size='lg'
					className='mt-8 w-full'
					disabled={!playableConfig}
					onMouseEnter={prefetchGame}
					onFocus={prefetchGame}
					onClick={handleStart}
				>
					<Play aria-hidden='true' fill='currentColor' />
					{t('singleplayer.start')}
				</Button>
				{playableConfig ? null : (
					<p
						role='status'
						className='mt-3 text-center text-sm font-bold text-coral-600'
					>
						{t('singleplayer.notEnoughCountries', {
							count: eligibleCount,
						})}
					</p>
				)}
			</Card>
		</PageShell>
	)
}
