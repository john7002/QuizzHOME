// Choix des mots d'une partie (cf. cahier des charges, « Choix des mots d'une partie »).

import { daysBetween } from './days'
import type { Day, Id, Progress, Word } from './types'

export interface SelectionOptions {
  /** Plafond de cartes par partie (15 à 20 par défaut). */
  maxCards?: number
  /** Mots nouveaux par partie (3 à 5). */
  maxNew?: number
  /** Au-delà de ce nombre de mots dus, aucun mot nouveau : on consolide d'abord. */
  newWordsThreshold?: number
}

export interface Selection {
  due: Word[]
  fresh: Word[]
}

export function isPlayable(w: Word, playerId: Id): boolean {
  return (
    w.status === 'actif' &&
    w.definition.trim() !== '' &&
    w.sentence.trim() !== '' &&
    (w.forPlayerId === undefined || w.forPlayerId === playerId)
  )
}

export function selectWords(
  words: Word[],
  progress: Progress[],
  playerId: Id,
  today: Day,
  { maxCards = 15, maxNew = 4, newWordsThreshold = 15 }: SelectionOptions = {},
): Selection {
  const byWord = new Map(progress.filter((p) => p.playerId === playerId).map((p) => [p.wordId, p]))
  const playable = words.filter((w) => isPlayable(w, playerId))

  // En retard (du plus en retard au moins en retard, puis par boîte croissante), puis dus aujourd'hui.
  const due = playable
    .filter((w) => byWord.has(w.id) && byWord.get(w.id)!.dueDay <= today)
    .sort((a, b) => {
      const pa = byWord.get(a.id)!
      const pb = byWord.get(b.id)!
      const lateness = daysBetween(pa.dueDay, today) - daysBetween(pb.dueDay, today)
      return lateness !== 0 ? -lateness : pa.box - pb.box
    })

  const takenDue = due.slice(0, maxCards)
  const fresh =
    due.length < newWordsThreshold
      ? playable
          .filter((w) => !byWord.has(w.id))
          .sort((a, b) => a.createdAt - b.createdAt)
          .slice(0, Math.min(maxNew, maxCards - takenDue.length))
      : []

  return { due: takenDue, fresh }
}
