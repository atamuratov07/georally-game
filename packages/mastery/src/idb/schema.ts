import {
	openDB,
	type DBSchema,
	type IDBPDatabase,
	type IDBPTransaction,
	type StoreNames,
} from 'idb'
import type { CardRecord, ReviewLogEntry } from '../types'

export const DB_NAME = 'georally-mastery'

export type MetaKey =
	'settings' | 'plan' | 'rechecks' | 'extraNew' | 'schedulerVersion'

export interface MasteryDb extends DBSchema {
	reviewLog: {
		key: string
		value: ReviewLogEntry
		indexes: { reviewedAt: number }
	}
	cards: { key: string; value: CardRecord }
	meta: { key: MetaKey; value: unknown }
}

type Migration = (
	db: IDBPDatabase<MasteryDb>,
	tx: IDBPTransaction<
		MasteryDb,
		ArrayLike<StoreNames<MasteryDb>>,
		'versionchange'
	>,
) => void

export const MIGRATIONS: readonly Migration[] = [
	db => {
		db.createObjectStore('reviewLog', { keyPath: 'id' }).createIndex(
			'reviewedAt',
			'reviewedAt',
		)
		db.createObjectStore('cards', { keyPath: 'id' })
		db.createObjectStore('meta')
	},
]

export const DB_VERSION = MIGRATIONS.length

export async function openMasteryDb(name = DB_NAME) {
	const db: IDBPDatabase<MasteryDb> = await openDB<MasteryDb>(
		name,
		DB_VERSION,
		{
			upgrade(database, oldVersion, _newVersion, tx) {
				for (let version = oldVersion; version < DB_VERSION; version += 1) {
					MIGRATIONS[version](database, tx)
				}
			},
			// A tab still open on an older version would otherwise block the
			// upgrade in a newer one until it is closed.
			blocking() {
				db.close()
			},
		},
	)
	return db
}
