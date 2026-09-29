// Classement familial, série de jours et tableau de bord (cf. « Joueurs, points et motivation »,
// « Tableau de bord des progrès »).

import { addDays, daysBetween } from './days'
import { REGULARITY_BONUS_PER_DAY } from './scoring'
import { ACQUIS, type Box, type Day, type Id, type Progress, type Review } from './types'

/** Lundi de la semaine de `day` (le classement de la semaine repart à zéro chaque lundi). */
export function weekStart(day: Day): Day {
  const [y, m, d] = day.split('-').map(Number)
  const weekday = (new Date(y, m - 1, d).getDay() + 6) % 7 // lundi = 0
  return addDays(day, -weekday)
}

export function monthStart(day: Day): Day {
  return day.slice(0, 8) + '01'
}

export type Period = 'semaine' | 'mois' | 'total'

export interface Standing {
  playerId: Id
  points: number
  cardPoints: number
  daysPlayed: number
  games: number
}

/** Points équilibrés gagnés + bonus de régularité (+5 par jour joué). Jamais le nombre d'erreurs. */
export function standings(reviews: Review[], playerIds: Id[], period: Period, today: Day): Standing[] {
  const from = period === 'semaine' ? weekStart(today) : period === 'mois' ? monthStart(today) : ''
  const inPeriod = reviews.filter((r) => r.day >= from && r.day <= today)
  return playerIds
    .map((playerId) => {
      const mine = inPeriod.filter((r) => r.playerId === playerId)
      const cardPoints = mine.reduce((n, r) => n + r.points, 0)
      const daysPlayed = new Set(mine.map((r) => r.day)).size
      return {
        playerId,
        cardPoints,
        daysPlayed,
        games: new Set(mine.map((r) => r.gameId)).size,
        points: cardPoints + daysPlayed * REGULARITY_BONUS_PER_DAY,
      }
    })
    .sort((a, b) => b.points - a.points)
}

export interface Streak {
  days: number
  /** Joker de la semaine en cours encore disponible. */
  jokerAvailable: boolean
  /** Jours rattrapés par un joker. */
  jokerDays: Day[]
}

/**
 * Série : jours d'affilée avec une partie. Une journée manquée par semaine (lundi → dimanche) est
 * couverte par le joker. Aujourd'hui ne casse pas la série tant que la partie n'est pas jouée.
 */
export function streak(playedDays: Iterable<Day>, today: Day): Streak {
  const played = new Set(playedDays)
  const jokerUsed = new Set<Day>() // lundis des semaines où le joker a servi
  const jokerDays: Day[] = []
  let days = 0
  let day = played.has(today) ? today : addDays(today, -1)
  const earliest = [...played].sort()[0]

  while (earliest && day >= earliest) {
    if (played.has(day)) {
      days++
    } else {
      const week = weekStart(day)
      if (jokerUsed.has(week) || !played.has(addDays(day, -1))) break
      jokerUsed.add(week)
      jokerDays.push(day)
    }
    day = addDays(day, -1)
  }
  return { days, jokerAvailable: !jokerUsed.has(weekStart(today)), jokerDays }
}

export const MILESTONES = [25, 50, 100, 200]

export function nextMilestone(acquired: number): number | undefined {
  return MILESTONES.find((m) => m > acquired)
}

export interface Dashboard {
  acquired: number
  inProgress: number
  boxes: Record<Box, number>
  hardWords: Progress[]
  lastAcquired: Id[]
  /** Mots acquis cumulés à la fin de chaque semaine (lundi de la semaine → total). */
  acquiredByWeek: { week: Day; total: number }[]
  playedDays: Day[]
}

export function dashboard(progress: Progress[], reviews: Review[], playerId: Id, today: Day, weeks = 8): Dashboard {
  const mine = progress.filter((p) => p.playerId === playerId)
  const boxes = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } as Record<Box, number>
  for (const p of mine) boxes[p.box]++

  const myReviews = reviews.filter((r) => r.playerId === playerId).sort((a, b) => a.at - b.at)
  const lastAcquired: Id[] = []
  for (const r of [...myReviews].reverse()) {
    if (r.boxAfter === ACQUIS && r.boxBefore < ACQUIS && !lastAcquired.includes(r.wordId)) {
      if (mine.find((p) => p.wordId === r.wordId)?.box === ACQUIS) lastAcquired.push(r.wordId)
    }
    if (lastAcquired.length === 10) break
  }

  const thisWeek = weekStart(today)
  const acquiredByWeek = Array.from({ length: weeks }, (_, i) => {
    const week = addDays(thisWeek, -7 * (weeks - 1 - i))
    const end = addDays(week, 6)
    let total = 0
    for (const r of myReviews) {
      if (r.day > end) break
      if (r.boxAfter === ACQUIS && r.boxBefore < ACQUIS) total++
      if (r.boxBefore === ACQUIS && r.boxAfter < ACQUIS) total--
    }
    return { week, total }
  })

  return {
    acquired: boxes[6],
    inProgress: mine.length - boxes[6],
    boxes,
    hardWords: mine.filter((p) => p.misses >= 3).sort((a, b) => b.misses - a.misses),
    lastAcquired,
    acquiredByWeek,
    playedDays: [...new Set(myReviews.map((r) => r.day))].filter((d) => daysBetween(d, today) < 30),
  }
}
