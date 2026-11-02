import {
	DEFAULT_GAME_CONFIG,
	type GameConfig,
} from '@georally/game-domain/singleplayer'
import { Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createSearchParams } from 'react-router-dom'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import { BackLink, PageShell } from '@/shared/layout'
import { Button, Card, CardHeader, CardTitle } from '@/shared/ui'
import { RegionPicker } from '@/shared/widgets/region-map/RegionPicker'
import {
	difficultyOptions,
	numberOptions,
} from '@/shared/widgets/settingOptions'
import { SettingToggleGroup } from '@/shared/widgets/SettingToggleGroup'
import {
	ATTEMPTS_PER_QUESTION_OPTIONS,
	DIFFICULTY_OPTIONS,
	QUESTION_COUNT_OPTIONS,
} from '../core/config'

const prefetchGame = () => {
	void import('./GamePage')
}

export default function SetupPage() {
	const { t } = useTranslation()
	const navigate = useLocalizedNavigate()
	const [config, setConfig] = useState<GameConfig>(DEFAULT_GAME_CONFIG)

	useEffect(() => {
		const timer = setTimeout(prefetchGame, 500)
		return () => clearTimeout(timer)
	}, [])

	function update(patch: Partial<GameConfig>) {
		setConfig(current => ({ ...current, ...patch }))
	}

	function handleStart() {
		navigate({
			pathname: '/singleplayer/play',
			search: `?${createSearchParams({
				questionCount: String(config.questionCount),
				attempts: String(config.attemptsPerQuestion),
				scope: config.scope,
				difficulty: config.difficulty,
			})}`,
		})
	}

	return (
		<PageShell width='lg'>
			<BackLink to='/'>{t('common.home')}</BackLink>
			<Card>
				<CardHeader>
					<CardTitle asChild>
						<h1>{t('singleplayer.title')}</h1>
					</CardTitle>
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
							value={config.questionCount}
							options={numberOptions(QUESTION_COUNT_OPTIONS)}
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
					onMouseEnter={prefetchGame}
					onFocus={prefetchGame}
					onClick={handleStart}
				>
					<Play aria-hidden='true' fill='currentColor' />
					{t('singleplayer.start')}
				</Button>
			</Card>
		</PageShell>
	)
}
