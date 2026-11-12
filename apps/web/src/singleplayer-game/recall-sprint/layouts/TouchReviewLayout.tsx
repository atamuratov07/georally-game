import { ProjectionToggle } from '@/shared/map/ProjectionToggle'
import { MissedCaption } from '../components/MissedCaption'
import { ReviewArrow } from '../components/ReviewArrow'
import { ReviewBar } from '../components/ReviewBar'
import type { ReviewControls } from '../reviewControls'

export function TouchReviewLayout({ controls }: { controls: ReviewControls }) {
	const { map } = controls

	return (
		<>
			<ReviewBar
				found={controls.found}
				total={controls.total}
				endedBy={controls.endedBy}
				onLeave={controls.onLeave}
				className='top-3'
			/>
			<ProjectionToggle
				className='absolute top-20 right-3 z-30'
				value={map.projection}
				globeDisabled={!map.globeAllowed}
				onChange={map.onProjectionChange}
			/>
			{controls.missedCount > 0 ? (
				<>
					<ReviewArrow
						direction={-1}
						onStep={controls.onStep}
						className='absolute bottom-6 left-3 z-30'
					/>
					<MissedCaption
						missedCount={controls.missedCount}
						position={controls.position}
						className='pointer-events-none absolute inset-x-0 bottom-6 z-30 flex h-14 items-center justify-center'
					/>
					<ReviewArrow
						direction={1}
						onStep={controls.onStep}
						className='absolute right-3 bottom-6 z-30'
					/>
				</>
			) : null}
		</>
	)
}
