// Opérations sur la base locale utilisées par les écrans.

import { db, getMeta, newId, setMeta } from './db'
import type { CardEffect, Game } from '../domain/game'
import { DEFAULT_SETTINGS, type Settings } from '../domain/settings'
import { normalize } from '../domain/text'
import type { ModeId, Player, Word } from '../domain/types'
import type { StarterPack } from './packs'

// ——— Réglages ———

export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await getMeta<Partial<Settings>>('settings')) }
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  await setMeta('settings', { ...(await getSettings()), ...patch })
}

// ——— Joueurs ———

export const PLAYER_COLORS = ['#5AD8FF', '#FF7A59', '#9B7BFF', '#C8F55A', '#FFC53D', '#FF8FC7']

export async function savePlayer(player: Omit<Player, 'id' | 'createdAt'> & { id?: string }): Promise<void> {
  await db.transaction('rw', db.players, async () => {
    const existing = player.id ? await db.players.get(player.id) : undefined
    const saved: Player = { ...player, id: player.id ?? newId(), createdAt: existing?.createdAt ?? Date.now() }
    // Un seul apprenant principal.
    if (saved.isMainLearner) {
      await db.players.toCollection().modify((p) => {
        if (p.id !== saved.id) p.isMainLearner = false
      })
    }
    await db.players.put(saved)
  })
}

export async function deletePlayer(id: string): Promise<void> {
  await db.transaction('rw', [db.players, db.progress, db.reviews, db.words], async () => {
    await db.words
      .where('forPlayerIds')
      .equals(id)
      .modify((w) => {
        w.forPlayerIds = w.forPlayerIds!.filter((p) => p !== id)
      })
    await db.players.delete(id)
    await db.progress.where('playerId').equals(id).delete()
    await db.reviews.where('playerId').equals(id).delete()
  })
}

// ——— Mots ———

export type WordInput = Omit<Word, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { id?: string }

/** Un brouillon (ajout au vol) n'entre pas en partie tant qu'il n'a pas sa phrase et sa définition. */
export function statusFor(w: Pick<Word, 'definition' | 'sentence'>, current?: Word['status']): Word['status'] {
  if (!w.definition.trim() || !w.sentence.trim()) return 'brouillon'
  return current === 'suspendu' ? 'suspendu' : 'actif'
}

export async function saveWord(input: WordInput): Promise<Word> {
  const now = Date.now()
  const existing = input.id ? await db.words.get(input.id) : undefined
  const word: Word = {
    ...input,
    id: input.id ?? newId(),
    word: input.word.trim(),
    sentence: input.sentence.trim(),
    definition: input.definition.trim(),
    status: statusFor(input, existing?.status),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  await db.words.put(word)
  if (existing?.imageId && existing.imageId !== word.imageId) await db.images.delete(existing.imageId)
  return word
}

export async function setSuspended(id: string, suspended: boolean): Promise<void> {
  const w = await db.words.get(id)
  if (!w) return
  await db.words.update(id, { status: suspended ? 'suspendu' : statusFor(w), updatedAt: Date.now() })
}

export async function deleteWord(id: string): Promise<void> {
  await db.transaction('rw', [db.words, db.progress, db.images], async () => {
    const w = await db.words.get(id)
    if (w?.imageId) await db.images.delete(w.imageId)
    await db.progress.where('wordId').equals(id).delete()
    await db.words.delete(id)
  })
}

export async function findDuplicates(text: string, exceptId?: string): Promise<Word[]> {
  const key = normalize(text)
  if (!key) return []
  const all = await db.words.toArray()
  return all.filter((w) => w.id !== exceptId && normalize(w.word) === key)
}

/**
 * Ajout par lot : une ligne par mot, « mot » seul (brouillon) ou « mot ; phrase ; définition ».
 * Le point-virgule, la tabulation ou la barre verticale servent de séparateur.
 */
export function parseBatch(text: string): { word: string; sentence: string; definition: string }[] {
  return text
    .split('\n')
    .map((line) => line.split(/\s*[;\t|]\s*/).map((s) => s.trim()))
    .filter(([word]) => word)
    .map(([word, sentence = '', definition = '']) => ({ word, sentence, definition }))
}

export async function addBatch(
  lines: { word: string; sentence: string; definition: string }[],
  common: Pick<Word, 'category' | 'forPlayerIds'>,
): Promise<number> {
  for (const l of lines) {
    await saveWord({ ...l, kind: l.word.trim().includes(' ') ? 'expression' : 'mot', ...common })
  }
  return lines.length
}

// ——— Images ———

const MAX_IMAGE_SIDE = 1024

/** Réduit la photo avant de la stocker, pour que la base et les sauvegardes restent légères. */
export async function storeImage(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.82))
  let blob = await encode('image/webp')
  if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg')
  const id = newId()
  await db.images.put({ id, blob: blob ?? file })
  return id
}

// ——— Partie ———

const CURRENT_GAME = 'currentGame'
const LAST_MODES = 'lastModes'

export async function loadCurrentGame(): Promise<Game | undefined> {
  return getMeta<Game>(CURRENT_GAME)
}

export async function saveCurrentGame(game: Game | undefined): Promise<void> {
  if (game && game.phase !== 'end') await setMeta(CURRENT_GAME, game)
  else await db.meta.delete(CURRENT_GAME)
}

/** Enregistre une carte validée : progression, historique et état de la partie, d'un seul coup. */
export async function recordCard(effect: CardEffect): Promise<void> {
  await db.transaction('rw', [db.progress, db.reviews, db.meta], async () => {
    if (effect.progress) await db.progress.put(effect.progress)
    if (effect.review) await db.reviews.add(effect.review)
    await saveCurrentGame(effect.game)
  })
}

export async function getLastModes(): Promise<ModeId[] | undefined> {
  return getMeta<ModeId[]>(LAST_MODES)
}

export async function setLastModes(modes: ModeId[]): Promise<void> {
  await setMeta(LAST_MODES, modes)
}

// ——— Paquets de départ ———

/** Ajoute les mots d'un paquet de départ, sauf ceux déjà présents. Renvoie le nombre de mots ajoutés. */
export async function activatePack(pack: StarterPack): Promise<number> {
  const existing = new Set((await db.words.toArray()).map((w) => normalize(w.word)))
  const now = Date.now()
  const words: Word[] = pack.words
    .filter((w) => !existing.has(normalize(w.word)))
    .map((w, i) => ({
      ...w,
      id: newId(),
      category: pack.category,
      status: 'actif',
      packId: pack.id,
      source: `Paquet de départ : ${pack.title} (${pack.level})`,
      // Ordre du paquet conservé : les plus faciles sortent en premier.
      createdAt: now + i,
      updatedAt: now,
    }))
  await db.words.bulkAdd(words)
  return words.length
}

export async function setPackSuspended(packId: string, suspended: boolean): Promise<void> {
  await db.words
    .filter((w) => w.packId === packId)
    .modify((w) => {
      w.status = suspended ? 'suspendu' : statusFor(w)
    })
}
