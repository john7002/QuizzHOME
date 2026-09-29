import { describe, expect, it } from 'vitest'
import { addDays } from './days'
import { standings, streak, weekStart } from './stats'
import type { Review } from './types'

const review = (playerId: string, day: string, points: number, gameId = day): Review => ({
  id: `${playerId}${day}${points}`,
  gameId,
  playerId,
  wordId: 'w',
  mode: 'carte-classique',
  family: 'rappel',
  result: 'reussi',
  boxBefore: 1,
  boxAfter: 2,
  points,
  day,
  at: 0,
})

describe('weekStart', () => {
  it('renvoie le lundi', () => {
    expect(weekStart('2026-09-29')).toBe('2026-09-28') // mardi → lundi
    expect(weekStart('2026-10-04')).toBe('2026-09-28') // dimanche → lundi
    expect(weekStart('2026-09-28')).toBe('2026-09-28')
  })
})

describe('standings', () => {
  it('ajoute +5 par jour joué et repart à zéro chaque lundi', () => {
    const reviews = [review('leo', '2026-09-27', 10), review('leo', '2026-09-28', 3), review('leo', '2026-09-29', 4), review('papa', '2026-09-29', 6)]
    const week = standings(reviews, ['leo', 'papa'], 'semaine', '2026-09-29')
    expect(week[0]).toMatchObject({ playerId: 'leo', points: 3 + 4 + 10, daysPlayed: 2 })
    expect(week[1]).toMatchObject({ playerId: 'papa', points: 11 })
    expect(standings(reviews, ['leo'], 'total', '2026-09-29')[0].points).toBe(17 + 15)
  })
})

describe('streak', () => {
  const today = '2026-09-29'
  const run = (n: number, from = today) => Array.from({ length: n }, (_, i) => addDays(from, -i))

  it('compte les jours d’affilée, sans casser la série si la partie du jour n’est pas encore jouée', () => {
    expect(streak(run(5), today).days).toBe(5)
    expect(streak(run(5, '2026-09-28'), today).days).toBe(5)
  })

  it('couvre un jour manqué par semaine avec le joker', () => {
    const days = [...run(3), ...run(4, '2026-09-25')] // trou le 26/09 (samedi)
    const s = streak(days, today)
    expect(s.days).toBe(7)
    expect(s.jokerDays).toEqual(['2026-09-26'])
    expect(s.jokerAvailable).toBe(true) // le joker du 26/09 appartient à la semaine précédente
  })

  it('casse la série après deux jours manqués', () => {
    expect(streak([...run(2), ...run(3, '2026-09-25')], today).days).toBe(2)
  })
})
