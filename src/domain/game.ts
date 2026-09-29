// Déroulé d'une partie (cf. cahier des charges, « Déroulé d'une partie »).
//
// Choix de conception :
// - chaque mot n'est joué qu'une fois par partie pour la répétition espacée ; les 3 manches se répartissent
//   les mots de chaque joueur du plus facile (boîtes basses, mots nouveaux → reconnaissance) au plus
//   exigeant (boîtes hautes → production) ;
// - l'apprenant principal joue une carte sur deux, les autres joueurs se partagent les autres tours ;
// - une carte ratée revient une fois en fin de manche, pour s'entraîner : ce second essai ne change
//   ni la boîte ni les points.

import { applyResult, newProgress } from './leitner'
import { buildChoices, buildTrueFalse, MODES, modeFor, ROUND_FAMILIES, type Rng } from './modes'
import { pointsFor, type ScoreTable } from './scoring'
import { selectWords } from './selection'
import type { Box, Day, Id, ModeFamily, ModeId, Player, Progress, Result, Review, Word } from './types'

export interface Card {
  id: string
  wordId: Id
  playerId: Id
  mode: ModeId
  retry: boolean
  isNew: boolean
  /** Le bon sens : définitions proposées et index de la bonne. */
  options?: string[]
  answer?: number
  /** Vrai ou faux : phrase montrée et si elle est juste. */
  shownSentence?: string
  isTrue?: boolean
}

export interface Round {
  family: ModeFamily
  mode: ModeId
  cards: Card[]
}

export interface CardOutcome {
  cardId: string
  playerId: Id
  wordId: Id
  result: Result
  points: number
  boxBefore: Box
  boxAfter: Box
  retry: boolean
}

export interface Game {
  id: Id
  day: Day
  startedAt: number
  playerIds: Id[]
  /** Mots nouveaux présentés avant la première manche (sans points ni chrono). */
  discovery: Id[]
  rounds: Round[]
  phase: 'discovery' | 'play' | 'end'
  roundIndex: number
  cardIndex: number
  outcomes: CardOutcome[]
}

export interface GameSetup {
  players: Player[]
  words: Word[]
  progress: Progress[]
  today: Day
  maxCards: number
  maxNew: number
  /** Mode choisi pour chaque manche (reconnaissance, rappel, production). */
  modes: [ModeId, ModeId, ModeId]
  rng?: Rng
  newId?: () => string
}

/** Ordre des tours : l'apprenant principal une carte sur deux, les autres à tour de rôle. */
export function turnOrder(players: Player[], total: number): Id[] {
  const main = players.find((p) => p.isMainLearner)
  const others = players.filter((p) => p !== main)
  if (!main || others.length === 0) {
    return Array.from({ length: total }, (_, i) => players[i % players.length].id)
  }
  const order: Id[] = []
  let o = 0
  for (let i = 0; i < total; i++) {
    order.push(i % 2 === 0 ? main.id : others[o++ % others.length].id)
  }
  return order
}

/** Répartit une liste en 3 parts, du début (facile) à la fin (exigeant). */
function splitInThree<T>(items: T[]): [T[], T[], T[]] {
  const n = items.length
  const a = Math.ceil(n / 3)
  const b = Math.ceil((n - a) / 2)
  return [items.slice(0, a), items.slice(a, a + b), items.slice(a + b)]
}

export function createGame(setup: GameSetup): Game {
  const { players, words, progress, today, maxCards, maxNew, modes } = setup
  const rng = setup.rng ?? Math.random
  const newId = setup.newId ?? (() => crypto.randomUUID())
  const wordById = new Map(words.map((w) => [w.id, w]))
  const boxOf = (playerId: Id, wordId: Id) =>
    progress.find((p) => p.playerId === playerId && p.wordId === wordId)?.box ?? 0

  // 1. Mots candidats de chaque joueur, dans l'ordre de priorité.
  //    L'apprenant principal choisit en premier ; les mots nouveaux déjà proposés à un joueur ne le
  //    sont pas à un autre.
  const queues = new Map<Id, { word: Word; isNew: boolean }[]>()
  const queued = new Set<Id>()
  for (const p of [...players].sort((a, b) => Number(b.isMainLearner) - Number(a.isMainLearner))) {
    const { due } = selectWords(words, progress, p.id, today, { maxCards, maxNew })
    const { fresh } = selectWords(
      words.filter((w) => !queued.has(w.id)),
      progress,
      p.id,
      today,
      { maxCards, maxNew, newWordsThreshold: due.length < 15 ? Infinity : 0 },
    )
    queues.set(p.id, [...due.map((word) => ({ word, isNew: false })), ...fresh.map((word) => ({ word, isNew: true }))])
    for (const w of [...due, ...fresh]) queued.add(w.id)
  }

  // 2. Mots de chaque joueur, en suivant l'ordre des tours. Un mot n'est donné qu'à un seul joueur
  //    par partie : sinon le second verrait la réponse juste avant son tour.
  const used = new Set<Id>()
  const chosen = new Map(players.map((p) => [p.id, [] as { word: Word; isNew: boolean }[]]))
  let total = 0
  for (const id of turnOrder(players, maxCards * players.length)) {
    if (total >= maxCards) break
    const queue = queues.get(id)!
    while (queue.length && used.has(queue[0].word.id)) queue.shift()
    const next = queue.shift()
    if (next) {
      used.add(next.word.id)
      chosen.get(id)!.push(next)
      total++
    }
  }

  // 3. Mots de chaque joueur triés du plus facile au plus exigeant, puis répartis dans les 3 manches.
  const parts = new Map(
    players.map((p) => {
      const mine = chosen.get(p.id)!
      mine.sort((a, b) => boxOf(p.id, a.word.id) - boxOf(p.id, b.word.id))
      return [p.id, splitInThree(mine)]
    }),
  )

  const rounds: Round[] = ROUND_FAMILIES.map((family, r) => {
    const cards: Card[] = []
    const pending = new Map(players.map((p) => [p.id, parts.get(p.id)![r].slice()]))
    const size = [...pending.values()].reduce((n, l) => n + l.length, 0)
    for (const playerId of turnOrder(players, size * players.length)) {
      if (cards.length >= size) break
      const next = pending.get(playerId)!.shift()
      if (next) cards.push(makeCard(next.word, playerId, modes[r], next.isNew, words, rng, newId))
    }
    return { family, mode: modes[r], cards }
  }).filter((r) => r.cards.length > 0)

  const discovery = [...chosen.values()].flatMap((l) => l.filter((c) => c.isNew).map((c) => c.word.id)).filter((id) => wordById.has(id))

  return {
    id: newId(),
    day: today,
    startedAt: Date.now(),
    playerIds: players.map((p) => p.id),
    discovery,
    rounds,
    phase: discovery.length > 0 ? 'discovery' : rounds.length > 0 ? 'play' : 'end',
    roundIndex: 0,
    cardIndex: 0,
    outcomes: [],
  }
}

function makeCard(
  word: Word,
  playerId: Id,
  preferred: ModeId,
  isNew: boolean,
  all: Word[],
  rng: Rng,
  newId: () => string,
): Card {
  const mode = modeFor(preferred, word, all)
  const card: Card = { id: newId(), wordId: word.id, playerId, mode, retry: false, isNew }
  if (mode === 'bon-sens') Object.assign(card, buildChoices(word, all, rng))
  if (mode === 'vrai-faux') {
    const tf = buildTrueFalse(word, all, rng)
    card.shownSentence = tf.sentence
    card.isTrue = tf.isTrue
  }
  return card
}

export function currentCard(game: Game): Card | undefined {
  if (game.phase !== 'play') return undefined
  return game.rounds[game.roundIndex]?.cards[game.cardIndex]
}

export function startRounds(game: Game): Game {
  return { ...game, phase: game.rounds.length > 0 ? 'play' : 'end' }
}

export interface CardEffect {
  game: Game
  /** Absent pour un second essai : il ne change ni la boîte ni les points. */
  progress?: Progress
  review?: Review
}

/** Valide la carte en cours : met à jour la boîte du joueur, compte les points, passe à la carte suivante. */
export function answerCard(
  game: Game,
  result: Result,
  ctx: {
    player: Player
    progress: Progress | undefined
    scores: ScoreTable
    today: Day
    now?: number
    newId?: () => string
  },
): CardEffect {
  const card = currentCard(game)
  if (!card) return { game }
  const now = ctx.now ?? Date.now()
  const family = MODES[card.mode].family
  const before = ctx.progress ?? newProgress(card.playerId, card.wordId, ctx.today)

  let progress: Progress | undefined
  let review: Review | undefined
  let outcome: CardOutcome
  if (card.retry) {
    outcome = { cardId: card.id, playerId: card.playerId, wordId: card.wordId, result, points: 0, boxBefore: before.box, boxAfter: before.box, retry: true }
  } else {
    progress = applyResult(before, result, family, ctx.today, now)
    const points = pointsFor(ctx.player.ageGroup, family, result, progress.box > before.box, ctx.scores)
    review = {
      id: (ctx.newId ?? (() => crypto.randomUUID()))(),
      gameId: game.id,
      playerId: card.playerId,
      wordId: card.wordId,
      mode: card.mode,
      family,
      result,
      boxBefore: before.box,
      boxAfter: progress.box,
      points,
      day: ctx.today,
      at: now,
    }
    outcome = { cardId: card.id, playerId: card.playerId, wordId: card.wordId, result, points, boxBefore: before.box, boxAfter: progress.box, retry: false }
  }

  const rounds = game.rounds.map((r, i) =>
    i === game.roundIndex && result === 'rate' && !card.retry
      ? { ...r, cards: [...r.cards, { ...card, id: card.id + ':2', retry: true }] }
      : r,
  )
  return { game: advance({ ...game, rounds, outcomes: [...game.outcomes, outcome] }), progress, review }
}

function advance(game: Game): Game {
  const round = game.rounds[game.roundIndex]
  if (game.cardIndex + 1 < round.cards.length) return { ...game, cardIndex: game.cardIndex + 1 }
  if (game.roundIndex + 1 < game.rounds.length) return { ...game, roundIndex: game.roundIndex + 1, cardIndex: 0 }
  return { ...game, phase: 'end' }
}

export function pointsByPlayer(game: Game): Map<Id, number> {
  const totals = new Map(game.playerIds.map((id) => [id, 0]))
  for (const o of game.outcomes) totals.set(o.playerId, (totals.get(o.playerId) ?? 0) + o.points)
  return totals
}

export function cardCount(game: Game): number {
  return game.rounds.reduce((n, r) => n + r.cards.length, 0)
}
