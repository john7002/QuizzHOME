// Points équilibrés selon l'âge (cf. cahier des charges, « Joueurs, points et motivation »).

import type { AgeGroup, ModeFamily, Result } from './types'

export type ScoreTable = Record<AgeGroup, Record<ModeFamily | 'presque' | 'monteeDeBoite', number>>

export const DEFAULT_SCORES: ScoreTable = {
  '12-14': { reconnaissance: 2, rappel: 3, production: 4, presque: 1, monteeDeBoite: 1 },
  '15-18': { reconnaissance: 1, rappel: 2, production: 3, presque: 1, monteeDeBoite: 1 },
  adulte: { reconnaissance: 1, rappel: 1, production: 2, presque: 0, monteeDeBoite: 1 },
}

export const REGULARITY_BONUS_PER_DAY = 5

export function pointsFor(
  ageGroup: AgeGroup,
  family: ModeFamily,
  result: Result,
  boxWentUp: boolean,
  table: ScoreTable = DEFAULT_SCORES,
): number {
  const row = table[ageGroup]
  if (result === 'rate') return 0
  if (result === 'presque') return row.presque
  return row[family] + (boxWentUp ? row.monteeDeBoite : 0)
}
