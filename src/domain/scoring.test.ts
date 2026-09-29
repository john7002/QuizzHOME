import { describe, expect, it } from 'vitest'
import { pointsFor } from './scoring'

describe('pointsFor', () => {
  it('applique le barème par âge', () => {
    expect(pointsFor('12-14', 'production', 'reussi', false)).toBe(4)
    expect(pointsFor('15-18', 'rappel', 'reussi', false)).toBe(2)
    expect(pointsFor('adulte', 'reconnaissance', 'reussi', false)).toBe(1)
  })

  it('ajoute +1 quand le mot monte de boîte', () => {
    expect(pointsFor('12-14', 'rappel', 'reussi', true)).toBe(4)
  })

  it('donne 1 point pour « Presque », sauf aux adultes, et 0 pour un raté', () => {
    expect(pointsFor('12-14', 'rappel', 'presque', false)).toBe(1)
    expect(pointsFor('adulte', 'rappel', 'presque', false)).toBe(0)
    expect(pointsFor('12-14', 'rappel', 'rate', false)).toBe(0)
  })
})
