import {
	DEFAULT_GAME_CONFIG,
	type GameConfig,
} from '@georally/game-domain/multiplayer'
import { useEffect, useState, type SubmitEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle } from '@/shared/ui'
import { RegionPicker } from '@/shared/widgets/region-map/RegionPicker'
import {
	difficultyOptions,
	numberOptions,
} from '@/shared/widgets/settingOptions'
import {
	SettingToggleGroup,
	type SettingOption,
} from '@/shared/widgets/SettingToggleGroup'
import {
	DIFFICULTY_OPTIONS,
	loadRoomGameConfig,
	QUESTION_COUNT_OPTIONS,
	QUESTION_DURATION_MS_OPTIONS,
	saveRoomGameConfig,
} from '../model/gameConfig'

const TIMER_OFF = 0

interface GameConfigPanelProps {
	roomCode: string
	formId: string
	requireQuestionDuration: boolean
	onStartGame: (config: GameConfig) => void
}

export function GameConfigPanel({
	roomCode,
	formId,
	requireQuestionDuration,
	onStartGame,
}: GameConfigPanelProps) {
	const { t } = useTranslation()
	const [config, setConfig] = useState<GameConfig>(() =>
		loadRoomGameConfig(roomCode),
	)

	useEffect(() => {
		setConfig(loadRoomGameConfig(roomCode))
	}, [roomCode])

	useEffect(() => {
		saveRoomGameConfig(roomCode, config)
	}, [roomCode, config])

	// Group rooms need a timer; fall back to the default if none was saved.
	const effectiveConfig: GameConfig =
		requireQuestionDuration && !config.questionDurationMs
			? {
					...config,
					questionDurationMs: DEFAULT_GAME_CONFIG.questionDurationMs,
				}
			: config

	function update(patch: Partial<GameConfig>) {
		setConfig(current => ({ ...current, ...patch }))
	}

	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault()
		onStartGame(effectiveConfig)
	}

	const timerOptions: SettingOption<number>[] = [
		...(requireQuestionDuration
			? []
			: [{ value: TIMER_OFF, label: t('settings.timerOff') }]),
		...QUESTION_DURATION_MS_OPTIONS.map(ms => ({
			value: ms,
			label: t('settings.seconds', { count: ms / 1000 }),
		})),
	]

	return (
		<Card asChild>
			<form id={formId} onSubmit={handleSubmit}>
				<CardHeader>
					<CardTitle className='text-xl sm:text-2xl'>
						{t('multiplayer.lobby.settings')}
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
					<SettingToggleGroup
						label={t('settings.questions')}
						value={config.questionCount}
						options={numberOptions(QUESTION_COUNT_OPTIONS)}
						onChange={questionCount => update({ questionCount })}
					/>
					<SettingToggleGroup
						label={t('settings.timer')}
						tone='grape'
						value={effectiveConfig.questionDurationMs ?? TIMER_OFF}
						options={timerOptions}
						onChange={ms =>
							update({
								questionDurationMs: ms === TIMER_OFF ? undefined : ms,
							})
						}
					/>
				</div>
			</form>
		</Card>
	)
}
