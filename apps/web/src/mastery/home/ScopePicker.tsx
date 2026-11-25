import type { GameContinent } from '@georally/game-domain'
import { useTranslation } from 'react-i18next'
import { getRegionLabel } from '@/shared/i18n'
import { ContinentMap } from '@/shared/widgets/region-map/ContinentMap'
import { CONTINENTS } from '@/shared/widgets/region-map/continents'

const OPTIONS = CONTINENTS.map(continent => ({
	value: continent as GameContinent,
	continents: [continent],
}))

interface ScopePickerProps {
	labelledBy: string
	added: ReadonlySet<GameContinent>
	picked: readonly GameContinent[]
	onChange: (picked: GameContinent[]) => void
}

export function ScopePicker({
	labelledBy,
	added,
	picked,
	onChange,
}: ScopePickerProps) {
	const { t } = useTranslation()

	return (
		<ContinentMap<GameContinent>
			labelledBy={labelledBy}
			options={OPTIONS}
			stateOf={continent =>
				added.has(continent)
					? 'fixed'
					: picked.includes(continent)
						? 'raised'
						: 'off'
			}
			labelOf={continent => getRegionLabel(t, continent)}
			onToggle={continent =>
				onChange(
					picked.includes(continent)
						? picked.filter(item => item !== continent)
						: [...picked, continent],
				)
			}
		/>
	)
}
