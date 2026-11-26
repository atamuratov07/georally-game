import { NameItMap } from '@/shared/map/NameItMap'
import { CountryInfoCard } from '@/shared/widgets/CountryInfoCard'
import type { NameRoundScreen } from './useNameRoundScreen'
import type { TargetRoundMap } from './useTargetRoundMap'

export function NameRoundMap({
	screen,
	map,
}: {
	screen: NameRoundScreen
	map: TargetRoundMap
}) {
	return (
		<NameItMap
			projection={screen.projection}
			focus={map.focus}
			targetId={map.targetId}
			outlined={map.outlined}
			highlights={map.highlights}
			labelIds={map.labelIds}
			markers={map.markers}
			reveal={map.reveal}
			popup={
				map.reveal && map.targetInfo ? (
					<CountryInfoCard info={map.targetInfo} />
				) : null
			}
			insets={screen.insets}
			cardHidden={screen.cardHidden}
			navigationTop={screen.navigationTop}
			onFocusSettled={map.handleFocusSettled}
		/>
	)
}
