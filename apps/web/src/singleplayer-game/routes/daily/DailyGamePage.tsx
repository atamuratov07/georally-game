import type { RouteState } from '@georally/game-domain/singleplayer/routes'
import { useState } from 'react'
import { RedirectWithSearch } from '../../RedirectWithSearch'
import type { GameStore } from '../../shared/gameStore'
import { GameErrorBoundary } from '../../shared/components/GameErrorBoundary'
import { GameErrorScreen } from '../../shared/components/GameErrorScreen'
import { KeyboardGameFrame } from '../../shared/components/KeyboardGameFrame'
import { RouteLeaveTarget } from '../leaveTarget'
import { RoutesScreen } from '../RoutesScreen'
import { useRoutesGame } from '../useRoutesGame'
import { DailyShareButton } from './DailyShareButton'
import { dailySlot, loadDailyEntries } from './dailyStore'
import { dailyToday } from './dailyToday'
import { dailyPaths } from './paths'

const stay = () => {}

export default function DailyGamePage() {
	const [today] = useState(() => dailyToday(Date.now(), loadDailyEntries()))

	if (today.kind !== 'puzzle') {
		return <RedirectWithSearch to={dailyPaths.page} />
	}

	return <DailyGame number={today.number} />
}

function DailyGame({ number }: { number: number }) {
	const [slot] = useState(() => dailySlot(number))

	return (
		<GameErrorBoundary
			fallback={<GameErrorScreen setupPath={dailyPaths.page} />}
			onError={slot.clear}
		>
			<DailyGameContent number={number} slot={slot} />
		</GameErrorBoundary>
	)
}

function DailyGameContent({
	number,
	slot,
}: {
	number: number
	slot: GameStore<RouteState>
}) {
	const { state, board, begin, attempt, hint, giveUp } = useRoutesGame(slot)
	const [openedFinished] = useState(() => state?.phase === 'finished')
	const solvedHere =
		!openedFinished &&
		state?.phase === 'finished' &&
		state.outcome === 'solved'

	if (state === null || board === null) {
		return <RedirectWithSearch to={dailyPaths.page} />
	}

	return (
		<RouteLeaveTarget
			value={{
				to: dailyPaths.page,
				state: solvedHere ? { solved: number } : undefined,
			}}
		>
			<KeyboardGameFrame>
				<RoutesScreen
					state={state}
					board={board}
					onReady={begin}
					onAttempt={attempt}
					onHint={hint}
					onGiveUp={giveUp}
					onLeave={stay}
					finishAction={
						state.phase === 'finished' ? (
							<DailyShareButton
								number={number}
								board={board}
								state={state}
								className='w-auto px-6'
							/>
						) : null
					}
				/>
			</KeyboardGameFrame>
		</RouteLeaveTarget>
	)
}
