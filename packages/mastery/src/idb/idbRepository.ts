import { DEFAULT_SETTINGS } from '../settings'
import type { MasteryMeta, MasteryRepository } from '../ports'
import type { CardId, Rechecks } from '../types'
import {
	isCardRecord,
	isExtraNew,
	isIntroPlan,
	isLearnerSettings,
	isRechecks,
	isReviewLogEntry,
} from './guards'
import { DB_NAME, openMasteryDb, type MasteryDb } from './schema'
import type { IDBPDatabase, IDBPTransaction, StoreNames } from 'idb'

async function computeOrAbort<T>(
	tx: IDBPTransaction<MasteryDb, StoreNames<MasteryDb>[], 'readwrite'>,
	compute: () => T,
) {
	try {
		return compute()
	} catch (error) {
		tx.abort()
		await tx.done.catch(() => {})
		throw error
	}
}

export function createIdbRepository(name = DB_NAME): MasteryRepository {
	let opening: Promise<IDBPDatabase<MasteryDb>> | undefined
	const database = () => (opening ??= openMasteryDb(name))

	return {
		async loadCards() {
			const cards = await (await database()).getAll('cards')
			return cards.filter(isCardRecord)
		},

		async loadLog(range) {
			const db = await database()
			const entries = range
				? await db.getAllFromIndex(
						'reviewLog',
						'reviewedAt',
						IDBKeyRange.bound(range.from, range.to, false, true),
					)
				: await db.getAll('reviewLog')
			return entries.filter(isReviewLogEntry)
		},

		async loadReviewTimes() {
			const index = (await database())
				.transaction('reviewLog')
				.store.index('reviewedAt')
			const times: number[] = []
			for (
				let cursor = await index.openKeyCursor();
				cursor;
				cursor = await cursor.continue()
			) {
				times.push(cursor.key)
			}
			return times
		},

		async loadMeta() {
			const tx = (await database()).transaction('meta')
			const [settings, plan, rechecks, extraNew, schedulerVersion] =
				await Promise.all([
					tx.store.get('settings'),
					tx.store.get('plan'),
					tx.store.get('rechecks'),
					tx.store.get('extraNew'),
					tx.store.get('schedulerVersion'),
				])
			return {
				settings: isLearnerSettings(settings) ? settings : DEFAULT_SETTINGS,
				plan: isIntroPlan(plan) ? plan : null,
				rechecks: isRechecks(rechecks) ? rechecks : {},
				extraNew: isExtraNew(extraNew) ? extraNew : null,
				schedulerVersion:
					typeof schedulerVersion === 'number' ? schedulerVersion : null,
			} satisfies MasteryMeta
		},

		async recordReview(cardId, compute) {
			const tx = (await database()).transaction(
				['cards', 'reviewLog', 'meta'],
				'readwrite',
			)
			const meta = tx.objectStore('meta')
			const [stored, storedRechecks] = await Promise.all([
				tx.objectStore('cards').get(cardId),
				meta.get('rechecks'),
			])
			const rechecks: Rechecks = isRechecks(storedRechecks)
				? storedRechecks
				: {}
			const recheckPending = rechecks[cardId] !== undefined

			const result = await computeOrAbort(tx, () =>
				compute(isCardRecord(stored) ? stored : undefined, recheckPending),
			)

			const writes: Promise<unknown>[] = [
				tx.objectStore('cards').put(result.card),
				tx.objectStore('reviewLog').add(result.entry),
			]
			if (recheckPending) {
				const rest = { ...rechecks }
				delete rest[cardId]
				writes.push(meta.put(rest, 'rechecks'))
			}
			await Promise.all([...writes, tx.done])
			return result
		},

		async replaceCards(fromLog, schedulerVersion) {
			const tx = (await database()).transaction(
				['reviewLog', 'cards', 'meta'],
				'readwrite',
			)
			const log = await tx.objectStore('reviewLog').getAll()
			const cards = await computeOrAbort(tx, () =>
				fromLog(log.filter(isReviewLogEntry)),
			)
			const store = tx.objectStore('cards')
			await Promise.all([
				store.clear(),
				...cards.map(card => store.put(card)),
				tx.objectStore('meta').put(schedulerVersion, 'schedulerVersion'),
				tx.done,
			])
		},

		async saveSettings(settings) {
			await (await database()).put('meta', settings, 'settings')
		},

		async savePlan(plan) {
			await (await database()).put('meta', plan, 'plan')
		},

		async saveExtraNew(extra) {
			await (await database()).put('meta', extra, 'extraNew')
		},

		async requestRecheck(cardIds: CardId[], at: number) {
			const tx = (await database()).transaction('meta', 'readwrite')
			const stored = await tx.store.get('rechecks')
			const rechecks: Rechecks = isRechecks(stored) ? { ...stored } : {}
			for (const cardId of cardIds) {
				rechecks[cardId] ??= at
			}
			await Promise.all([tx.store.put(rechecks, 'rechecks'), tx.done])
		},
	}
}
