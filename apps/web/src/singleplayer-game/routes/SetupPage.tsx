import {
	createIdleState,
	type RoutePracticeConfig,
	type RouteScope,
} from '@georally/game-domain/singleplayer/routes'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import { useLocalizedSearchParams } from '@/app/useLocalizedSearchParams'
import { getDifficultyLabel } from '@/shared/i18n'
import { prefetchMap } from '@/shared/map/prefetchMap'
import { RegionMapPicker } from '@/shared/widgets/region-map/RegionPicker'
import { difficultyOptions } from '@/shared/widgets/settingOptions'
import { SettingToggleGroup } from '@/shared/widgets/SettingToggleGroup'
import { singleplayerPaths } from '../paths'
import { ResumeGameCard } from '../shared/components/ResumeGameCard'
import { SetupCard } from '../shared/components/SetupCard'
import { SetupShell } from '../shared/components/SetupShell'
import { DIFFICULTY_OPTIONS } from '../shared/setupParams'
import {
	readSetupConfig,
	ROUTE_SCOPE_OPTIONS,
	routeScopeLabel,
	toSearchParams,
} from './config'
import { BordersNote } from './components/BordersNote'
import { useCountryName } from './countryNames'
import { routeGameStore } from './store'

const paths = singleplayerPaths('routes')

const prefetchGame = () => {
	void import('./GamePage')
	prefetchMap()
}

function loadResumableGame() {
	const game = routeGameStore.load()
	return game?.phase === 'playing' ? game : null
}

export default function SetupPage() {
	const { t } = useTranslation()
	const countryName = useCountryName()
	const navigate = useLocalizedNavigate()
	const [searchParams, setSearchParams] = useLocalizedSearchParams()
	const config = readSetupConfig(searchParams)
	const [saved, setSaved] = useState(loadResumableGame)

	useEffect(() => {
		const timer = setTimeout(prefetchGame, 500)
		return () => clearTimeout(timer)
	}, [])

	function update(patch: Partial<RoutePracticeConfig>) {
		setSearchParams(toSearchParams({ ...config, ...patch }), {
			replace: true,
		})
	}

	function setupLink(): string {
		const url = new URL(window.location.href)
		url.search = toSearchParams(config).toString()
		return url.toString()
	}

	function handleStart() {
		routeGameStore.save(createIdleState(config))
		navigate(paths.play)
	}

	if (saved) {
		const known = saved.guesses.length + saved.hints.length
		const settings =
			saved.config.kind === 'practice'
				? [
						routeScopeLabel(t, saved.config.scope),
						getDifficultyLabel(t, saved.config.difficulty),
					]
				: []
		return (
			<SetupShell mode='routes'>
				<ResumeGameCard
					heading={`${countryName(saved.startId)} → ${countryName(saved.targetId)}`}
					details={[
						...settings,
						t('routes.resume.guesses', { count: known }),
					].join(' · ')}
					onResume={() => navigate(paths.play)}
					onDiscard={() => {
						routeGameStore.clear()
						setSaved(null)
					}}
				/>
			</SetupShell>
		)
	}

	return (
		<SetupShell mode='routes'>
			<SetupCard
				mode='routes'
				copyLink={setupLink()}
				note={<BordersNote />}
				onStart={handleStart}
				onPrefetch={prefetchGame}
			>
				<RegionMapPicker<RouteScope>
					label={t('settings.region')}
					value={config.scope}
					options={ROUTE_SCOPE_OPTIONS}
					labelOf={scope => routeScopeLabel(t, scope)}
					onChange={scope => update({ scope })}
				/>
				<SettingToggleGroup
					label={t('settings.difficulty')}
					value={config.difficulty}
					options={difficultyOptions(t, DIFFICULTY_OPTIONS)}
					onChange={difficulty => update({ difficulty })}
				/>
			</SetupCard>
		</SetupShell>
	)
}
