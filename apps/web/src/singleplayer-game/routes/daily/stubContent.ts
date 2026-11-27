import { dailyRoutes } from '@georally/country-catalog/daily-routes'
import {
	createIdleState,
	getScore,
} from '@georally/game-domain/singleplayer/routes'
import type { TFunction } from 'i18next'
import { localDay } from '@/shared/time/localDay'
import { weekdayKey } from '@/shared/time/weekdays'
import { dailySlot } from './dailyStore'
import type { DailyToday } from './dailyToday'
import { dailyPaths } from './paths'

export type StubAction =
	| { kind: 'opens'; ms: number }
	| { kind: 'play' | 'continue' }
	| { kind: 'result'; score: string; ms: number }

export interface StubContent {
	to: string
	number: number
	eyebrow: string
	carried: boolean
	action: StubAction
	onOpen?: () => void
}

export function stubContent(
	today: DailyToday,
	now: number,
	t: TFunction,
): StubContent | null {
	if (today.kind === 'over') return null
	if (today.kind === 'soon') {
		return {
			to: dailyPaths.page,
			number: 1,
			eyebrow: t(`common.weekday.${weekdayKey(dailyRoutes.launch)}`),
			carried: false,
			action: { kind: 'opens', ms: today.opensAt - now },
		}
	}

	const { number, entry, game, carried } = today
	const base = {
		number,
		eyebrow: t(carried ? 'daily.yesterday' : 'daily.today'),
		carried,
	}
	if (game?.phase === 'finished') {
		return {
			...base,
			to: dailyPaths.page,
			action: {
				kind: 'result',
				score:
					game.outcome === 'solved'
						? `${getScore(game)}/${entry.par}`
						: t('routes.result.gaveUp'),
				ms: localDay(now).end - now,
			},
		}
	}
	return {
		...base,
		to: dailyPaths.play,
		action: { kind: game?.phase === 'playing' ? 'continue' : 'play' },
		onOpen:
			!game || game.phase === 'idle'
				? () =>
						dailySlot(number).save(
							createIdleState({ kind: 'daily', number }),
						)
				: undefined,
	}
}
