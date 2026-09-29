import { describe, expect, it } from 'vitest'
import { applyResult, newProgress } from './leitner'
import type { Box, Progress } from './types'

const today = '2026-09-29'
const at = (box: Box, acquisStreak = 0): Progress => ({ ...newProgress('p', 'w', today), box, acquisStreak })

describe('applyResult', () => {
  it('fait monter un mot réussi d’une boîte et espace sa révision', () => {
    const p = applyResult(at(1), 'reussi', 'rappel', today)
    expect(p.box).toBe(2)
    expect(p.dueDay).toBe('2026-10-01')
  })

  it('passe de la boîte 5 à « Acquis » à 30 jours, puis 60', () => {
    const acquis = applyResult(at(5), 'reussi', 'rappel', today)
    expect(acquis.box).toBe(6)
    expect(acquis.dueDay).toBe('2026-10-29')
    const again = applyResult(acquis, 'reussi', 'rappel', today)
    expect(again.box).toBe(6)
    expect(again.dueDay).toBe('2026-11-28')
  })

  it('laisse un mot « Presque » dans sa boîte, à la même échéance', () => {
    const p = applyResult(at(3), 'presque', 'rappel', today)
    expect(p.box).toBe(3)
    expect(p.dueDay).toBe('2026-10-03')
  })

  it('renvoie un mot raté en boîte 1', () => {
    const p = applyResult(at(4), 'rate', 'rappel', today)
    expect(p.box).toBe(1)
    expect(p.misses).toBe(1)
    expect(p.dueDay).toBe('2026-09-30')
  })

  it('ne fait redescendre un mot « Acquis » raté qu’en boîte 3', () => {
    expect(applyResult(at(6, 2), 'rate', 'rappel', today).box).toBe(3)
  })

  it('bloque la reconnaissance à la boîte 2', () => {
    expect(applyResult(at(1), 'reussi', 'reconnaissance', today).box).toBe(2)
    expect(applyResult(at(2), 'reussi', 'reconnaissance', today).box).toBe(2)
    expect(applyResult(at(2), 'reussi', 'production', today).box).toBe(3)
  })
})
