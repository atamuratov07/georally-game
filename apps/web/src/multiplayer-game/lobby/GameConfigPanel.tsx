import type { GameConfig } from '@georally/game-domain/multiplayer'
import { Gauge, Globe2, ListChecks, Timer } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { SelectControl } from '../../shared/ui'
import {
	DIFFICULTY_OPTIONS,
	loadRoomGameConfig,
	QUESTION_COUNT_OPTIONS,
	QUESTION_DURATION_MS_OPTIONS,
	saveRoomGameConfig,
	SCOPE_OPTIONS,
} from '../model/gameConfig'
import { useTranslation } from 'react-i18next'
import { getDifficultyLabel, getScopeLabel } from '../../shared/i18n'

interface GameConfigPanelProps {
	roomCode: string
	formId: string
	requireQuestionDuration: boolean
	onStartGame: (config: GameConfig) => void
}

interface ConfigFieldProps {
	icon: ReactNode
	label: string
	children: ReactNode
}

function ConfigField({ icon, label, children }: ConfigFieldProps) {
	return (
		<label className='group block rounded-2xl border border-slate-200 bg-white/88 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition hover:border-amber-300/80 hover:bg-white'>
			<span className='mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500'>
				<span className='grid h-8 w-8 place-items-center rounded-xl bg-amber-100 text-amber-700 transition group-hover:bg-amber-200'>
					{icon}
				</span>
				{label}
			</span>
			{children}
		</label>
	)
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

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		onStartGame(config)
	}

	return (
		<form
			id={formId}
			className='mx-auto mt-6 w-full max-w-5xl overflow-hidden rounded-[26px] border border-white/70 bg-white/94 text-left shadow-[0_24px_72px_rgba(15,23,42,0.14)] backdrop-blur'
			onSubmit={handleSubmit}
		>
			<div className='border-b border-slate-200/80 bg-linear-to-br from-white via-amber-50/80 to-teal-50/70 px-5 py-4 sm:px-6'>
				<p className='text-[11px] font-black uppercase tracking-[0.22em] text-amber-700'>
					{t('multiplayer.config.title')}
				</p>
				<h2 className='mt-1 text-2xl font-black tracking-tight text-slate-950'>
					{t('multiplayer.config.questions')}
				</h2>
			</div>

			<div className='grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4'>
				<ConfigField
					icon={
						<ListChecks aria-hidden='true' size={17} strokeWidth={2.4} />
					}
					label={t('multiplayer.config.questions')}
				>
					<SelectControl
						value={config.questionCount}
						className='h-12 rounded-2xl border-slate-200 bg-slate-50 font-black'
						onChange={event => {
							setConfig(current => ({
								...current,
								questionCount: Number(event.target.value),
							}))
						}}
					>
						{QUESTION_COUNT_OPTIONS.map(option => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</SelectControl>
				</ConfigField>

				<ConfigField
					icon={<Timer aria-hidden='true' size={17} strokeWidth={2.4} />}
					label={t('multiplayer.config.timer')}
				>
					<SelectControl
						value={config.questionDurationMs}
						className='h-12 rounded-2xl border-slate-200 bg-slate-50 font-black'
						onChange={event => {
							const newValue = event.target.value
								? Number(event.target.value)
								: undefined
							setConfig(current => {
								return {
									...current,
									questionDurationMs: newValue,
								}
							})
						}}
					>
						{!requireQuestionDuration && (
							<option key={'no-timer'} value={''}>
								{t('multiplayer.config.withoutTimer')}
							</option>
						)}
						{QUESTION_DURATION_MS_OPTIONS.map(option => (
							<option key={option} value={option}>
								{t('multiplayer.config.seconds', {
									count: option / 1000,
								})}
							</option>
						))}
					</SelectControl>
				</ConfigField>

				<ConfigField
					icon={<Globe2 aria-hidden='true' size={17} strokeWidth={2.4} />}
					label={t('multiplayer.config.region')}
				>
					<SelectControl
						value={config.scope}
						className='h-12 rounded-2xl border-slate-200 bg-slate-50 font-black'
						onChange={event => {
							setConfig(current => ({
								...current,
								scope: event.target.value as GameConfig['scope'],
							}))
						}}
					>
						{SCOPE_OPTIONS.map(option => (
							<option key={option.value} value={option.value}>
								{getScopeLabel(t, option.value)}
							</option>
						))}
					</SelectControl>
				</ConfigField>

				<ConfigField
					icon={<Gauge aria-hidden='true' size={17} strokeWidth={2.4} />}
					label={t('multiplayer.config.difficulty')}
				>
					<SelectControl
						value={config.difficulty}
						className='h-12 rounded-2xl border-slate-200 bg-slate-50 font-black'
						onChange={event => {
							setConfig(current => ({
								...current,
								difficulty: event.target
									.value as GameConfig['difficulty'],
							}))
						}}
					>
						{DIFFICULTY_OPTIONS.map(option => (
							<option key={option.value} value={option.value}>
								{getDifficultyLabel(t, option.value)}
							</option>
						))}
					</SelectControl>
				</ConfigField>
			</div>
		</form>
	)
}
