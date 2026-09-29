// Les modes de jeu de la version 1 (cf. cahier des charges, « Les modes de jeu »).

import { normalize, splitSentence, swapWord } from './text'
import type { ModeFamily, ModeId, Word } from './types'

export interface ModeInfo {
  id: ModeId
  name: string
  family: ModeFamily
  /** Consigne affichée au joueur dont c'est le tour. */
  hint: string
}

export const MODES: Record<ModeId, ModeInfo> = {
  'bon-sens': {
    id: 'bon-sens',
    name: 'Le bon sens',
    family: 'reconnaissance',
    hint: 'Choisis la bonne définition',
  },
  'vrai-faux': {
    id: 'vrai-faux',
    name: 'Vrai ou faux',
    family: 'reconnaissance',
    hint: 'Le mot est-il bien employé ?',
  },
  'carte-classique': {
    id: 'carte-classique',
    name: 'Carte classique',
    family: 'rappel',
    hint: 'Dis le sens à voix haute, puis retourne la carte',
  },
  'mot-cache': {
    id: 'mot-cache',
    name: 'Le mot caché',
    family: 'rappel',
    hint: 'Trouve le mot qui manque',
  },
  'quel-sens': {
    id: 'quel-sens',
    name: 'Quel sens ?',
    family: 'rappel',
    hint: 'Explique le sens du mot dans chaque phrase',
  },
  'a-toi-la-phrase': {
    id: 'a-toi-la-phrase',
    name: 'À toi la phrase',
    family: 'production',
    hint: 'Invente une phrase juste avec ce mot',
  },
  'fais-deviner': {
    id: 'fais-deviner',
    name: 'Fais deviner',
    family: 'production',
    hint: 'Fais deviner le mot sans le dire',
  },
}

export const MODES_BY_FAMILY: Record<ModeFamily, ModeId[]> = {
  reconnaissance: ['bon-sens', 'vrai-faux'],
  rappel: ['carte-classique', 'mot-cache', 'quel-sens'],
  production: ['a-toi-la-phrase', 'fais-deviner'],
}

export const ROUND_FAMILIES: ModeFamily[] = ['reconnaissance', 'rappel', 'production']

/** Mode de repli quand un mot n'a pas ce qu'il faut pour le mode de la manche. */
const FALLBACK: Record<ModeFamily, ModeId> = {
  reconnaissance: 'vrai-faux',
  rappel: 'carte-classique',
  production: 'a-toi-la-phrase',
}

export function otherSenses(word: Word, all: Word[]): Word[] {
  const key = normalize(word.word)
  return all.filter((w) => w.id !== word.id && normalize(w.word) === key && w.definition.trim() !== '')
}

function withDefinition(all: Word[], except: Word): Word[] {
  return all.filter((w) => w.id !== except.id && w.definition.trim() !== '' && normalize(w.word) !== normalize(except.word))
}

export function isEligible(mode: ModeId, word: Word, all: Word[]): boolean {
  switch (mode) {
    case 'bon-sens':
      return withDefinition(all, word).length >= 2
    case 'mot-cache':
      return splitSentence(word.sentence, word.word).found
    case 'quel-sens':
      return !!word.knownSense?.trim() || otherSenses(word, all).length > 0
    default:
      return true
  }
}

export function modeFor(preferred: ModeId, word: Word, all: Word[]): ModeId {
  if (isEligible(preferred, word, all)) return preferred
  const family = MODES[preferred].family
  const alt = MODES_BY_FAMILY[family].find((m) => isEligible(m, word, all))
  return alt ?? FALLBACK[family]
}

export type Rng = () => number

export function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = items.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** QCM : la bonne définition + 2 définitions d'autres mots, de préférence de la même classe grammaticale. */
export function buildChoices(word: Word, all: Word[], rng: Rng): { options: string[]; answer: number } {
  // Pas de synonyme parmi les mauvaises réponses : sa définition serait juste elle aussi.
  const key = normalize(word.word)
  const synonyms = new Set((word.synonyms ?? []).map(normalize))
  const pool = shuffle(
    withDefinition(all, word).filter((w) => !synonyms.has(normalize(w.word)) && !(w.synonyms ?? []).some((s) => normalize(s) === key)),
    rng,
  )
  const samePos = word.partOfSpeech ? pool.filter((w) => w.partOfSpeech === word.partOfSpeech) : []
  const others = [...samePos, ...pool.filter((w) => !samePos.includes(w))]
  const distractors = [...new Set(others.map((w) => w.definition))].filter((d) => d !== word.definition).slice(0, 2)
  const options = shuffle([word.definition, ...distractors], rng)
  return { options, answer: options.indexOf(word.definition) }
}

/** Vrai ou faux : la phrase juste, ou une phrase absurde (saisie par le parent, ou fabriquée par échange). */
export function buildTrueFalse(word: Word, all: Word[], rng: Rng): { sentence: string; isTrue: boolean } {
  if (rng() < 0.5) return { sentence: word.sentence, isTrue: true }
  if (word.absurdSentence?.trim()) return { sentence: word.absurdSentence, isTrue: false }
  const hosts = shuffle(
    all.filter((w) => w.id !== word.id && normalize(w.word) !== normalize(word.word)),
    rng,
  )
  for (const host of hosts) {
    const swapped = swapWord(host.sentence, host.word, word.word)
    if (swapped) return { sentence: swapped, isTrue: false }
  }
  return { sentence: word.sentence, isTrue: true }
}
