import { playableCountryPool } from '@georally/country-catalog'
import { fsrsScheduler } from '../src/fsrs/fsrsScheduler'
import { PACES } from '../src/settings'
import { simulate, type SimulatedDay } from '../src/simulation/simulate'
import type { Pace } from '../src/types'

const DAYS = 120
const SETTLED_FROM = 40
const BREAK = { from: 50, length: 10 }

function average(values: readonly number[]) {
	return values.length === 0
		? 0
		: values.reduce((sum, value) => sum + value, 0) / values.length
}

function minutes(ms: number) {
	return (ms / 60_000).toFixed(1)
}

function allIntroducedOn(days: readonly SimulatedDay[]) {
	const total = Object.keys(playableCountryPool.countriesById).length
	let introduced = 0
	for (const day of days) {
		introduced += day.newCards
		if (introduced >= total) {
			return String(day.day + 1)
		}
	}
	return 'never'
}

function daysToClear(days: readonly SimulatedDay[]) {
	const back = BREAK.from + BREAK.length
	const cleared = days.findIndex(
		day => day.day >= back && day.dueLeftOver === 0,
	)
	return cleared === -1 ? 'never' : String(cleared - back)
}

const rows = (Object.keys(PACES) as Pace[]).flatMap(pace => {
	const everyDay = simulate({
		pace,
		days: DAYS,
		pool: playableCountryPool,
		scheduler: fsrsScheduler,
		seed: 1,
	}).days
	const withBreak = simulate({
		pace,
		days: DAYS,
		breakDays: BREAK,
		pool: playableCountryPool,
		scheduler: fsrsScheduler,
		seed: 1,
	}).days
	const settled = everyDay.filter(day => day.day >= SETTLED_FROM)
	const returned = withBreak[BREAK.from + BREAK.length]

	return {
		pace,
		cap: PACES[pace].reviewCap,
		'avg reviews': average(settled.map(day => day.reviews)).toFixed(1),
		'peak reviews': Math.max(...everyDay.map(day => day.reviews)),
		'avg min': minutes(average(settled.map(day => day.sessionMs))),
		'peak min': minutes(Math.max(...everyDay.map(day => day.sessionMs))),
		'cut days': everyDay.filter(day => day.dueLeftOver > 0).length,
		'all new by day': allIntroducedOn(everyDay),
		'return reviews': returned.reviews,
		'return min': minutes(returned.sessionMs),
		'days to clear': daysToClear(withBreak),
	}
})

console.log(
	`${DAYS} days; averages from day ${SETTLED_FROM}; a ${BREAK.length}-day break from day ${BREAK.from}`,
)
console.table(rows)
