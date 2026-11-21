import type { RouteBoard } from '@georally/game-domain/singleplayer/routes'
import { useTranslation } from 'react-i18next'
import { flagUrlOf, useCountryName } from '../countryNames'
import { IntroJourneyView, JourneyView, type JourneyEnd } from './JourneyView'

function useEnds(board: RouteBoard): [JourneyEnd, JourneyEnd] {
	const countryName = useCountryName()
	return [board.startId, board.targetId].map(id => ({
		name: countryName(id),
		flagUrl: flagUrlOf(id),
	})) as [JourneyEnd, JourneyEnd]
}

export function RouteJourney({
	board,
	score,
	arrow,
	className,
}: {
	board: RouteBoard
	score: number
	arrow: 'above' | 'below'
	className?: string
}) {
	const { t } = useTranslation()
	const [start, target] = useEnds(board)

	return (
		<JourneyView
			start={start}
			target={target}
			score={score}
			par={board.par}
			arrow={arrow}
			title={t('routes.journey', { start: start.name, target: target.name })}
			className={className}
		/>
	)
}

export function IntroJourney({
	board,
	arrow,
	onShown,
}: {
	board: RouteBoard
	arrow: 'above' | 'below'
	onShown: () => void
}) {
	const [start, target] = useEnds(board)

	return (
		<IntroJourneyView
			start={start}
			target={target}
			par={board.par}
			arrow={arrow}
			onShown={onShown}
		/>
	)
}
