import { describe, expect, it } from 'vitest'
import { selectWords } from './selection'
import type { Box, Progress, Word } from './types'

const today = '2026-09-29'

const word = (id: string, over: Partial<Word> = {}): Word => ({
  id,
  kind: 'mot',
  word: id,
  sentence: `Phrase avec ${id}.`,
  definition: `Sens de ${id}`,
  category: 'Lecture',
  status: 'actif',
  createdAt: 0,
  updatedAt: 0,
  ...over,
})

const prog = (wordId: string, dueDay: string, box: Box = 1): Progress => ({
  playerId: 'leo',
  wordId,
  box,
  dueDay,
  acquisStreak: 0,
  misses: 0,
  lastReviewedAt: 0,
})

describe('selectWords', () => {
  it('met les mots en retard d’abord, du plus en retard, puis par boîte', () => {
    const words = ['a', 'b', 'c', 'd'].map((id) => word(id))
    const progress = [prog('a', today, 1), prog('b', '2026-09-20', 3), prog('c', '2026-09-27', 4), prog('d', '2026-09-27', 2)]
    const { due } = selectWords(words, progress, 'leo', today)
    expect(due.map((w) => w.id)).toEqual(['b', 'd', 'c', 'a'])
  })

  it('ignore les mots pas encore dus, les brouillons, les suspendus et ceux d’un autre joueur', () => {
    const words = [
      word('futur'),
      word('brouillon', { definition: '' }),
      word('pause', { status: 'suspendu' }),
      word('ines', { forPlayerIds: ['ines', 'papa'] }),
    ]
    const { due, fresh } = selectWords(words, [prog('futur', '2026-10-05')], 'leo', today)
    expect(due).toEqual([])
    expect(fresh).toEqual([])
  })

  it('propose un mot à chacun des joueurs choisis, et à eux seuls', () => {
    const words = [word('perso', { forPlayerIds: ['leo', 'ines'] }), word('famille', { forPlayerIds: [] })]
    const ids = (p: string) => selectWords(words, [], p, today).fresh.map((w) => w.id)
    expect(ids('leo')).toEqual(['perso', 'famille'])
    expect(ids('ines')).toEqual(['perso', 'famille'])
    expect(ids('papa')).toEqual(['famille'])
  })

  it('ajoute au plus 4 mots nouveaux, seulement si moins de 15 mots sont dus', () => {
    const fresh = Array.from({ length: 6 }, (_, i) => word(`n${i}`, { createdAt: i }))
    expect(selectWords(fresh, [], 'leo', today).fresh.map((w) => w.id)).toEqual(['n0', 'n1', 'n2', 'n3'])

    const dueWords = Array.from({ length: 15 }, (_, i) => word(`d${i}`))
    const progress = dueWords.map((w) => prog(w.id, today))
    const sel = selectWords([...dueWords, ...fresh], progress, 'leo', today)
    expect(sel.due).toHaveLength(15)
    expect(sel.fresh).toEqual([])
  })

  it('plafonne la partie', () => {
    const dueWords = Array.from({ length: 30 }, (_, i) => word(`d${i}`))
    const sel = selectWords(dueWords, dueWords.map((w) => prog(w.id, today)), 'leo', today, { maxCards: 20 })
    expect(sel.due).toHaveLength(20)
  })
})
