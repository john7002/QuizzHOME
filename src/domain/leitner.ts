// Répétition espacée à 5 boîtes + « Acquis » (cf. cahier des charges, « Répétition espacée »).

import { addDays } from './days'
import { ACQUIS, type Box, type Day, type ModeFamily, type Progress, type Result } from './types'

/** Délai avant la prochaine révision, en jours, pour chaque boîte. */
const INTERVALS: Record<Exclude<Box, 6>, number> = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 }
const ACQUIS_FIRST = 30
const ACQUIS_NEXT = 60

/** Les modes de reconnaissance ne font pas dépasser la boîte 2. */
const RECOGNITION_CAP: Box = 2

export function intervalFor(box: Box, acquisStreak: number): number {
  if (box === ACQUIS) return acquisStreak === 0 ? ACQUIS_FIRST : ACQUIS_NEXT
  return INTERVALS[box]
}

export function newProgress(playerId: string, wordId: string, today: Day): Progress {
  return { playerId, wordId, box: 1, dueDay: today, acquisStreak: 0, misses: 0, lastReviewedAt: 0 }
}

export function applyResult(
  p: Progress,
  result: Result,
  family: ModeFamily,
  today: Day,
  now: number = Date.now(),
): Progress {
  let box = p.box
  let acquisStreak = p.acquisStreak
  let misses = p.misses

  if (result === 'reussi') {
    if (box === ACQUIS) {
      acquisStreak += 1
    } else if (!(family === 'reconnaissance' && box >= RECOGNITION_CAP)) {
      box = (box + 1) as Box
      if (box === ACQUIS) acquisStreak = 0
    }
  } else if (result === 'rate') {
    misses += 1
    box = p.box === ACQUIS ? 3 : 1
    acquisStreak = 0
  }
  // « Presque » : même boîte, revu à la même échéance.

  const dueDay = addDays(today, intervalFor(box, acquisStreak))
  return { ...p, box, acquisStreak, misses, dueDay, lastReviewedAt: now }
}

export function movedUp(before: Box, after: Box): boolean {
  return after > before
}
