import {
	DEFAULT_GAME_CONFIG,
	type GameConfig,
} from '@georally/game-domain/singleplayer'
import { useCallback, useEffect, useState } from 'react'
import { createSearchParams } from 'react-router-dom'
import {
	Button,
	ButtonLink,
	Field,
	ScreenShell,
	SelectControl,
	SurfacePanel,
} from '../../shared/ui'
import {
	ATTEMPTS_PER_QUESTION_OPTIONS,
	DIFFICULTY_OPTIONS,
	QUESTION_COUNT_OPTIONS,
	SCOPE_OPTIONS,
} from '../core/config'
import {
	getDifficultyLabel,
	getScopeLabel,
	LanguageSwitcher,
} from '../../shared/i18n'
import { MoveLeftIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocalizedNavigate } from '../../app/useLocalizedNavigate'

const prefetchGame = () => {
	import('./GamePage')
}

export default function SetupPage() {
	const { t } = useTranslation()
	const navigate = useLocalizedNavigate()
	const [config, setConfig] = useState<GameConfig>(DEFAULT_GAME_CONFIG)

	useEffect(() => {
		const timer = setTimeout(() => {
			prefetchGame()
		}, 500)
		return () => clearTimeout(timer)
	}, [])

	const updateConfig = useCallback((patch: Partial<GameConfig>) => {
		setConfig(currentConfig => ({
			...currentConfig,
			...patch,
		}))
	}, [])

	const handleStart = useCallback(() => {
		navigate({
			pathname: '/singleplayer/play',
			search: `?${createSearchParams({
				questionCount: String(config.questionCount),
				attempts: String(config.attemptsPerQuestion),
				scope: config.scope,
				difficulty: config.difficulty,
			})}`,
		})
	}, [config, navigate])

	const scopeLabel = getScopeLabel(t, config.scope)
	const difficultyLabel =
		getDifficultyLabel(t, config.difficulty) ?? config.difficulty

	return (
		<ScreenShell className='px-5 py-8 sm:px-8'>
			<div className='mx-auto max-w-3xl'>
				<div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
					<ButtonLink to='/' variant='nav' size='pill'>
						<MoveLeftIcon size={16} className='stroke-3' />
						{t('singleplayer.toModes')}
					</ButtonLink>
					<LanguageSwitcher className='py-2.5 shadow-none text-slate-700 bg-white/85 border-slate-300' />
				</div>

				<SurfacePanel
					width='xl'
					className='border-white/60 bg-white/90 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8'
				>
					<h1 className='mb-2 text-3xl sm:text-5xl font-black leading-none tracking-tight text-slate-950'>
						{t('singleplayer.title')}
					</h1>
					<p className='mb-6 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base'>
						{t('singleplayer.setupDescription')}
					</p>

					<div className='grid gap-4 sm:grid-cols-2'>
						<Field label={t('singleplayer.fields.questionCount')}>
							<SelectControl
								accent='teal'
								className='rounded-lg border-slate-400 py-2 shadow-sm'
								value={config.questionCount}
								onChange={event => {
									updateConfig({
										questionCount: Number(event.target.value),
									})
								}}
							>
								{QUESTION_COUNT_OPTIONS.map(option => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</SelectControl>
						</Field>

						<Field label={t('singleplayer.fields.attemptsPerQuestion')}>
							<SelectControl
								accent='teal'
								className='rounded-lg border-slate-400 py-2 shadow-sm'
								value={config.attemptsPerQuestion}
								onChange={event => {
									updateConfig({
										attemptsPerQuestion: Number(event.target.value),
									})
								}}
							>
								{ATTEMPTS_PER_QUESTION_OPTIONS.map(option => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</SelectControl>
						</Field>

						<Field label={t('singleplayer.fields.scope')}>
							<SelectControl
								accent='teal'
								className='rounded-lg border-slate-400 py-2 shadow-sm'
								value={config.scope}
								onChange={event => {
									updateConfig({
										scope: event.target.value as GameConfig['scope'],
									})
								}}
							>
								{SCOPE_OPTIONS.map(option => (
									<option key={option.value} value={option.value}>
										{getScopeLabel(t, option.value)}
									</option>
								))}
							</SelectControl>
						</Field>

						<Field label={t('singleplayer.fields.difficulty')}>
							<SelectControl
								accent='teal'
								className='rounded-lg border-slate-400 py-2 shadow-sm'
								value={config.difficulty}
								onChange={event => {
									updateConfig({
										difficulty: event.target
											.value as GameConfig['difficulty'],
									})
								}}
							>
								{DIFFICULTY_OPTIONS.map(option => (
									<option key={option.value} value={option.value}>
										{getDifficultyLabel(t, option.value)}
									</option>
								))}
							</SelectControl>
						</Field>
					</div>

					<div className='mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4'>
						<div className='flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600'>
							<span>
								<strong className='text-slate-900'>
									{config.questionCount}
								</strong>{' '}
								{t('singleplayer.summary.questions', {
									count: config.questionCount,
								}).replace(`${config.questionCount} `, '')}
							</span>
							<span>
								<strong className='text-slate-900'>
									{config.attemptsPerQuestion}
								</strong>{' '}
								{t('singleplayer.summary.attempts', {
									count: config.attemptsPerQuestion,
								}).replace(`${config.attemptsPerQuestion} `, '')}
							</span>
							<span className='capitalize'>
								<strong className='text-slate-900'>{scopeLabel}</strong>
							</span>
							<span className='capitalize'>
								<strong className='text-slate-900'>
									{difficultyLabel}
								</strong>
							</span>
						</div>

						<Button
							type='button'
							variant='teal'
							is3d
							className='w-full sm:w-auto'
							onMouseEnter={prefetchGame}
							onClick={handleStart}
						>
							{t('singleplayer.start')}
						</Button>
					</div>
				</SurfacePanel>
			</div>
		</ScreenShell>
	)
}
