import { CardToggle } from '@/shared/map/CardToggle'
import { ProjectionToggle } from '@/shared/map/ProjectionToggle'
import type { NameRoundControls } from './types'
import type { NameRoundScreen } from './useNameRoundScreen'
import type { TargetRoundMap } from './useTargetRoundMap'

export function NameRoundLayer({
	screen,
	map,
	controls,
}: {
	screen: NameRoundScreen
	map: TargetRoundMap
	controls: NameRoundControls
}) {
	const { Component: Layout } = screen.layout

	return (
		<Layout
			controls={controls}
			slots={screen.slots}
			keyboardInset={screen.keyboardInset}
			projectionToggle={
				<ProjectionToggle
					value={screen.projection}
					globeDisabled={!screen.globeAllowed}
					onChange={screen.setProjection}
				/>
			}
			cardToggle={
				map.reveal ? (
					<CardToggle
						hidden={screen.cardHidden}
						onHiddenChange={screen.setCardHidden}
					/>
				) : null
			}
		/>
	)
}
