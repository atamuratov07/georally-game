import {
	getLastMove,
	getTimeline,
	type RouteBoard,
	type StartedRouteState,
} from '@georally/game-domain/singleplayer/routes'
import { useTranslation } from 'react-i18next'
import { useCountryName } from './countryNames'

export function RouteAnnouncement({
	state,
	board,
}: {
	state: StartedRouteState
	board: RouteBoard
}) {
	const { t } = useTranslation()
	const countryName = useCountryName()
	const verdictOf = (countryId: string) =>
		t(`routes.verdict.${board.verdict(countryId)}`)
	const move = getLastMove(state)
	const message = (move?.countryIds ?? [])
		.map(countryId =>
			t(move?.kind === 'hint' ? 'routes.announceHint' : 'routes.announce', {
				name: countryName(countryId),
				verdict: verdictOf(countryId),
			}),
		)
		.join('. ')

	return (
		<p className='sr-only' aria-live='polite'>
			{message || null}
		</p>
	)
}

export function GuessList({
	state,
	board,
}: {
	state: StartedRouteState
	board: RouteBoard
}) {
	const { t } = useTranslation()
	const countryName = useCountryName()
	const timeline = getTimeline(state)

	if (timeline.length === 0) {
		return null
	}

	return (
		<ul aria-label={t('routes.guesses')} className='sr-only'>
			{timeline.map(event => {
				const values = {
					name: countryName(event.countryId),
					verdict: t(`routes.verdict.${board.verdict(event.countryId)}`),
				}
				return (
					<li key={event.countryId}>
						{event.kind === 'hint'
							? t('routes.announceHint', values)
							: t('routes.announce', values)}
					</li>
				)
			})}
		</ul>
	)
}
