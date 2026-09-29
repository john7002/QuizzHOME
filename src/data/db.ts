// Base locale de l'appareil (IndexedDB). Toutes les données de QUIZZHOME vivent ici.

import Dexie, { type EntityTable } from 'dexie'
import type { MetaEntry, Player, Progress, Review, StoredImage, Word } from '../domain/types'

export class QuizzDb extends Dexie {
  words!: EntityTable<Word, 'id'>
  players!: EntityTable<Player, 'id'>
  progress!: Dexie.Table<Progress, [string, string]>
  reviews!: EntityTable<Review, 'id'>
  images!: EntityTable<StoredImage, 'id'>
  meta!: EntityTable<MetaEntry, 'key'>

  constructor(name = 'quizzhome') {
    super(name)
    this.version(1).stores({
      words: 'id, status, category, kind, forPlayerId, word',
      players: 'id',
      progress: '[playerId+wordId], playerId, wordId, dueDay, box',
      reviews: 'id, gameId, playerId, wordId, day',
      images: 'id',
      meta: 'key',
    })
    // v2 : « Pour qui ? » accepte plusieurs joueurs (forPlayerId → forPlayerIds).
    this.version(2)
      .stores({ words: 'id, status, category, kind, *forPlayerIds, word' })
      .upgrade((tx) => tx.table('words').toCollection().modify(migrateWord))
  }
}

/** Convertit une fiche d'un ancien format (sauvegarde ou base v1). */
export function migrateWord(w: Record<string, unknown>): void {
  if ('forPlayerId' in w) {
    if (w.forPlayerId) w.forPlayerIds = [w.forPlayerId]
    delete w.forPlayerId
  }
}

export const db = new QuizzDb()

export const newId = () => crypto.randomUUID()

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await db.meta.get(key))?.value as T | undefined
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value })
}

/** Demande au navigateur de ne jamais effacer la base pour libérer de la place. */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  return (await navigator.storage.persisted()) || navigator.storage.persist()
}
