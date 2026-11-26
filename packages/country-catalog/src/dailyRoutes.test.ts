import {
	createRouteBoard,
	dailyDay,
	dailyLevel,
	dailyNumber,
	fitsLevel,
	ratingRank,
} from '@georally/game-domain/singleplayer/routes'
import { describe, expect, it } from 'vitest'
import { borderGraph } from './borders'
import { playableCountryPool } from './catalog'
import { dailyRoutes } from './dailyRoutes'

const { launch, puzzles } = dailyRoutes
const rank = ratingRank(playableCountryPool)

describe('daily routes', () => {
	it('still match the borders and their weekday level', () => {
		const stale = puzzles.flatMap((entry, i) => {
			const level = dailyLevel(dailyDay(launch, i + 1))
			const board = createRouteBoard(borderGraph, entry)
			const fits =
				board?.par === entry.par &&
				entry.level === level &&
				fitsLevel(borderGraph, rank, entry, entry.par, level)
			return fits ? [] : [i + 1]
		})
		expect(stale).toEqual([])
	})

	it('repeat no endpoint within 30 puzzles', () => {
		const repeats = puzzles.flatMap((entry, i) => {
			const recent = puzzles
				.slice(Math.max(0, i - 30), i)
				.flatMap(other => [other.startId, other.targetId])
			return recent.includes(entry.startId) ||
				recent.includes(entry.targetId)
				? [i + 1]
				: []
		})
		expect(repeats).toEqual([])
	})

	it('last at least 60 more days', () => {
		const today = new Date().toISOString().slice(0, 10)
		expect(
			puzzles.length - dailyNumber(launch, today),
		).toBeGreaterThanOrEqual(60)
	})
})
