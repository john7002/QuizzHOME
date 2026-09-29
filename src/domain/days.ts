import type { Day } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

export function toDay(date: Date = new Date()): Day {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parse(day: Day): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(day: Day, n: number): Day {
  const date = parse(day)
  date.setDate(date.getDate() + n)
  return toDay(date)
}

/** Nombre de jours de `a` à `b` (positif si `b` est après `a`). */
export function daysBetween(a: Day, b: Day): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000)
}
