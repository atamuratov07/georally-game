import { ProjectionToggle } from '@/shared/map/ProjectionToggle'
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
				onLeave={controls.onLeave}
			/>
			<ProjectionToggle
				className='absolute top-20 right-3 z-30'
				value={map.projection}
				globeDisabled={!map.globeAllowed}
				onChange={map.onProjectionChange}
			/>
			{controls.hasMissed ? (
				<>
					<ReviewArrow
						direction={-1}
						onStep={controls.onStep}
						className='absolute bottom-6 left-3 z-30'
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
