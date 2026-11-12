import {
	createIdleState,
	SPRINT_LENGTHS,
	sprintDurationMs,
	type SprintConfig,
} from '@georally/game-domain/singleplayer/recall-sprint'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import { useLocalizedSearchParams } from '@/app/useLocalizedSearchParams'
import { prefetchMap } from '@/shared/map/prefetchMap'
import { RegionPicker } from '@/shared/widgets/region-map/RegionPicker'
import { SettingToggleGroup } from '@/shared/widgets/SettingToggleGroup'
import { singleplayerPaths } from '../paths'
import { SetupCard } from '../shared/components/SetupCard'
import { SetupShell } from '../shared/components/SetupShell'
import { readSetupConfig, toSearchParams } from './config'
import { regionCountryIds } from './sprintRegion'
import { sprintGameStore } from './store'

const paths = singleplayerPaths('recall-sprint')

const prefetchGame = () => {
	void import('./GamePage')
	prefetchMap()
}

function formatDuration(ms: number): string {
	const totalSeconds = Math.round(ms / 1000)
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export default function SetupPage() {
	const { t } = useTranslation()
	const navigate = useLocalizedNavigate()
	const [searchParams, setSearchParams] = useLocalizedSearchParams()
	const config = readSetupConfig(searchParams)
	const countryCount = regionCountryIds(config.scope).length

	useEffect(() => {
		const timer = setTimeout(prefetchGame, 500)
		return () => clearTimeout(timer)
	}, [])

	function update(patch: Partial<SprintConfig>) {
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
		sprintGameStore.save(createIdleState(config))
		navigate(paths.play)
	}

	return (
		<SetupShell mode='recall-sprint'>
			<SetupCard
				mode='recall-sprint'
				copyLink={setupLink()}
				canStart={countryCount > 0}
				eligibleCount={countryCount}
				onStart={handleStart}
				onPrefetch={prefetchGame}
			>
				<RegionPicker
					label={t('settings.region')}
					value={config.scope}
					onChange={scope => update({ scope })}
				/>
				<SettingToggleGroup
					label={t('settings.sprintLength')}
					tone='coral'
					value={config.length}
					options={SPRINT_LENGTHS.map(length => ({
						value: length,
						label: formatDuration(sprintDurationMs(countryCount, length)),
					}))}
					onChange={length => update({ length })}
				/>
			</SetupCard>
		</SetupShell>
	)
}
