import {
	createIdleState,
	type RoutePracticeConfig,
	type RouteRegion,
} from '@georally/game-domain/singleplayer/routes'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import { useLocalizedSearchParams } from '@/app/useLocalizedSearchParams'
import { getDifficultyLabel, getRegionLabel } from '@/shared/i18n'
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
	ROUTE_REGION_OPTIONS,
	routeRegionLabel,
	routeRegionsLabel,
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
						routeRegionsLabel(t, saved.config.regions),
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
				<RegionMapPicker<RouteRegion>
					label={t('settings.region')}
					value={config.regions}
					options={ROUTE_REGION_OPTIONS}
					labelOf={region => routeRegionLabel(t, region)}
					worldLabel={getRegionLabel(t, 'all')}
					onChange={regions => update({ regions })}
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
