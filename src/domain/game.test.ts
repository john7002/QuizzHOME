import { describe, expect, it } from 'vitest'
import { answerCard, cardCount, createGame, currentCard, startRounds, turnOrder, type Game } from './game'
import { DEFAULT_SCORES } from './scoring'
import type { Box, Player, Progress, Word } from './types'

const today = '2026-09-29'

const player = (id: string, over: Partial<Player> = {}): Player => ({
  id,
  name: id,
  color: '#fff',
  avatar: id[0],
  ageGroup: '12-14',
  isMainLearner: false,
  createdAt: 0,
  ...over,
})

const word = (id: string, over: Partial<Word> = {}): Word => ({
  id,
  kind: 'mot',
  word: id,
  sentence: `Une phrase avec ${id} dedans.`,
  definition: `Sens de ${id}`,
  category: 'Lecture',
  status: 'actif',
  createdAt: 0,
  updatedAt: 0,
  ...over,
})

const due = (playerId: string, wordId: string, box: Box): Progress => ({
  playerId,
  wordId,
  box,
  dueDay: today,
  acquisStreak: 0,
  misses: 0,
  lastReviewedAt: 0,
})

let n = 0
const newId = () => `id${n++}`
const rng = () => 0.3

describe('turnOrder', () => {
  it('fait jouer l’apprenant principal une carte sur deux', () => {
    const players = [player('maman'), player('leo', { isMainLearner: true }), player('papa')]
    expect(turnOrder(players, 6)).toEqual(['leo', 'maman', 'leo', 'papa', 'leo', 'maman'])
  })
})

describe('createGame', () => {
  const words = Array.from({ length: 9 }, (_, i) => word(`w${i}`))

  it('répartit les mots du plus facile (reconnaissance) au plus exigeant (production)', () => {
    const progress = words.map((w, i) => due('leo', w.id, ((i % 5) + 1) as Box))
    const game = createGame({
      players: [player('leo', { isMainLearner: true })],
      words,
      progress,
      today,
      maxCards: 9,
      maxNew: 4,
      modes: ['bon-sens', 'carte-classique', 'a-toi-la-phrase'],
      rng,
      newId,
    })
    expect(game.rounds.map((r) => r.family)).toEqual(['reconnaissance', 'rappel', 'production'])
    expect(cardCount(game)).toBe(9)
    const boxOf = (id: string) => progress.find((p) => p.wordId === id)!.box
    const maxBox = (r: number) => Math.max(...game.rounds[r].cards.map((c) => boxOf(c.wordId)))
    const minBox = (r: number) => Math.min(...game.rounds[r].cards.map((c) => boxOf(c.wordId)))
    expect(maxBox(0)).toBeLessThanOrEqual(minBox(1))
    expect(maxBox(1)).toBeLessThanOrEqual(minBox(2))
    const qcm = game.rounds[0].cards[0]
    expect(qcm.options).toHaveLength(3)
    expect(qcm.options![qcm.answer!]).toBe(`Sens de ${qcm.wordId}`)
  })

  it('commence par la découverte des mots nouveaux', () => {
    const game = createGame({
      players: [player('leo', { isMainLearner: true })],
      words,
      progress: [],
      today,
      maxCards: 15,
      maxNew: 3,
      modes: ['vrai-faux', 'mot-cache', 'fais-deviner'],
      rng,
      newId,
    })
    expect(game.phase).toBe('discovery')
    expect(game.discovery).toHaveLength(3)
    expect(cardCount(game)).toBe(3)
  })

  it('plafonne la partie au nombre de cartes réglé', () => {
    const players = [player('leo', { isMainLearner: true }), player('ines')]
    const progress = players.flatMap((p) => words.map((w) => due(p.id, w.id, 2)))
    const game = createGame({ players, words, progress, today, maxCards: 8, maxNew: 4, modes: ['bon-sens', 'carte-classique', 'a-toi-la-phrase'], rng, newId })
    expect(cardCount(game)).toBe(8)
    const cards = game.rounds.flatMap((r) => r.cards)
    expect(cards.filter((c) => c.playerId === 'leo')).toHaveLength(4)
  })

  it('ne donne jamais le même mot à deux joueurs dans une partie', () => {
    const players = [player('leo', { isMainLearner: true }), player('ines')]
    const game = createGame({ players, words, progress: [], today, maxCards: 8, maxNew: 4, modes: ['bon-sens', 'carte-classique', 'a-toi-la-phrase'], rng, newId })
    const ids = game.rounds.flatMap((r) => r.cards.map((c) => c.wordId))
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toHaveLength(8)
  })
})

describe('answerCard', () => {
  const leo = player('leo', { isMainLearner: true })
  const words = [word('a'), word('b'), word('c')]

  function start(): Game {
    const progress = words.map((w) => due('leo', w.id, 3))
    return startRounds(
      createGame({ players: [leo], words, progress, today, maxCards: 3, maxNew: 0, modes: ['bon-sens', 'carte-classique', 'a-toi-la-phrase'], rng, newId }),
    )
  }

  it('met à jour la boîte et compte les points', () => {
    const game = start()
    const card = currentCard(game)!
    const effect = answerCard(game, 'reussi', { player: leo, progress: due('leo', card.wordId, 3), scores: DEFAULT_SCORES, today, newId })
    // Reconnaissance en boîte 3 : pas de montée de boîte, 2 points pour un 12-14 ans.
    expect(effect.progress!.box).toBe(3)
    expect(effect.review!.points).toBe(2)
    expect(effect.game.cardIndex + effect.game.roundIndex).toBe(1)
  })

  it('fait revenir une carte ratée en fin de manche, sans rien changer au second essai', () => {
    let game = start()
    const card = currentCard(game)!
    game = answerCard(game, 'rate', { player: leo, progress: due('leo', card.wordId, 3), scores: DEFAULT_SCORES, today, newId }).game
    const retry = currentCard(game)!
    expect(retry.retry).toBe(true)
    expect(retry.wordId).toBe(card.wordId)
    const effect = answerCard(game, 'reussi', { player: leo, progress: due('leo', card.wordId, 1), scores: DEFAULT_SCORES, today, newId })
    expect(effect.progress).toBeUndefined()
    expect(effect.review).toBeUndefined()
  })

  it('termine la partie après la dernière carte', () => {
    let game = start()
    while (game.phase === 'play') {
      const card = currentCard(game)!
      game = answerCard(game, 'reussi', { player: leo, progress: due('leo', card.wordId, 3), scores: DEFAULT_SCORES, today, newId }).game
    }
    expect(game.phase).toBe('end')
    expect(game.outcomes).toHaveLength(3)
  })
})

describe('createGame avec peu de mots', () => {
  it('fait jouer tout le monde, les autres joueurs après l’apprenant principal', () => {
    const players = [player('leo', { isMainLearner: true }), player('ines'), player('papa', { ageGroup: 'adulte' })]
    const words = [word('a'), word('b'), word('c')]
    const game = createGame({ players, words, progress: [], today, maxCards: 15, maxNew: 4, modes: ['bon-sens', 'carte-classique', 'a-toi-la-phrase'], rng, newId })
    const cards = game.rounds.flatMap((r) => r.cards)
    for (const p of players) expect(cards.filter((c) => c.playerId === p.id).map((c) => c.wordId).sort()).toEqual(['a', 'b', 'c'])
    expect(game.discovery).toHaveLength(3)
    // Dans chaque manche, la carte de Léo sur un mot passe avant celles des autres joueurs.
    for (const round of game.rounds) {
      for (const c of round.cards.filter((c) => c.playerId !== 'leo')) {
        const leo = round.cards.findIndex((x) => x.playerId === 'leo' && x.wordId === c.wordId)
        expect(leo).toBeGreaterThanOrEqual(0)
        expect(leo).toBeLessThan(round.cards.indexOf(c))
      }
    }
  })

  it('respecte le plafond de cartes', () => {
    const players = [player('leo', { isMainLearner: true }), player('ines')]
    const words = [word('a'), word('b'), word('c')]
    const game = createGame({ players, words, progress: [], today, maxCards: 4, maxNew: 4, modes: ['bon-sens', 'carte-classique', 'a-toi-la-phrase'], rng, newId })
    expect(cardCount(game)).toBe(4)
  })
})
