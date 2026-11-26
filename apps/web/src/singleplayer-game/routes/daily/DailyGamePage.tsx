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
			<RouteLeaveTarget value={dailyPaths.page}>
				<DailyGameContent slot={slot} />
			</RouteLeaveTarget>
		</GameErrorBoundary>
	)
}

function DailyGameContent({ slot }: { slot: GameStore<RouteState> }) {
	const { state, board, begin, attempt, hint, giveUp } = useRoutesGame(slot)

	if (state === null || board === null) {
		return <RedirectWithSearch to={dailyPaths.page} />
	}

	return (
		<KeyboardGameFrame>
			<RoutesScreen
				state={state}
				board={board}
				onReady={begin}
				onAttempt={attempt}
				onHint={hint}
				onGiveUp={giveUp}
				onLeave={stay}
				onNext={null}
			/>
		</KeyboardGameFrame>
	)
}
