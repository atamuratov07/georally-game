import { ProjectionToggle } from '@/shared/map/ProjectionToggle'
import { MissedCaption } from '../components/MissedCaption'
import { ReviewArrow } from '../components/ReviewArrow'
import { ReviewBar } from '../components/ReviewBar'
import type { ReviewControls } from '../reviewControls'

export function DesktopReviewLayout({
	controls,
}: {
	controls: ReviewControls
}) {
	const { map } = controls

	return (
		<>
			<ReviewBar
				found={controls.found}
				total={controls.total}
				endedBy={controls.endedBy}
				onLeave={controls.onLeave}
				className='top-4'
			/>
			<ProjectionToggle
				className='absolute top-18 left-3 z-30'
				value={map.projection}
				globeDisabled={!map.globeAllowed}
				onChange={map.onProjectionChange}
			/>
			{controls.missedCount > 0 ? (
				<div className='absolute inset-x-0 bottom-6 z-30 flex items-center justify-center gap-4'>
					<ReviewArrow direction={-1} onStep={controls.onStep} />
					<MissedCaption
						missedCount={controls.missedCount}
						position={controls.position}
					/>
					<ReviewArrow direction={1} onStep={controls.onStep} />
				</div>
			) : null}
		</>
	)
}
