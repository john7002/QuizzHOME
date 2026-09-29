// Modèle de données de QUIZZHOME (cf. cahier des charges, « La fiche mot »).

export type Id = string

/** Jour civil local, au format AAAA-MM-JJ. Les échéances se comptent en jours, pas en heures. */
export type Day = string

export type WordKind = 'mot' | 'expression'
export type WordStatus = 'brouillon' | 'actif' | 'suspendu'
export type Category = 'Lecture' | 'École' | 'Vie courante' | (string & {})

export interface Word {
  id: Id
  kind: WordKind
  word: string
  /** Phrase contexte ; le mot y apparaît tel quel pour être mis en valeur. */
  sentence: string
  /** Vide tant que la fiche est un brouillon (ajout au vol). */
  definition: string
  category: Category
  status: WordStatus
  /** « Sens nouveau d'un mot connu » : rappel de l'autre sens. */
  knownSense?: string
  partOfSpeech?: string
  synonyms?: string[]
  antonyms?: string[]
  family?: string[]
  imageId?: Id
  emoji?: string
  source?: string
  mimable?: boolean
  /** Phrase absurde pour « Vrai ou faux ». */
  absurdSentence?: string
  /** Joueurs à qui le mot est destiné ; absent ou vide = pour toute la famille. */
  forPlayerIds?: Id[]
  /** Paquet de départ d'où vient le mot, s'il y a lieu. */
  packId?: string
  createdAt: number
  updatedAt: number
}

export type AgeGroup = '12-14' | '15-18' | 'adulte'

export interface Player {
  id: Id
  name: string
  color: string
  avatar: string
  ageGroup: AgeGroup
  isMainLearner: boolean
  createdAt: number
}

/** Boîtes 1 à 5, puis 6 = « Acquis ». */
export type Box = 1 | 2 | 3 | 4 | 5 | 6
export const ACQUIS = 6 satisfies Box

/** Progression d'un joueur sur un mot (chaque joueur a ses propres boîtes). */
export interface Progress {
  playerId: Id
  wordId: Id
  box: Box
  dueDay: Day
  /** Nombre de révisions réussies en « Acquis » : 30 jours la première fois, 60 ensuite. */
  acquisStreak: number
  misses: number
  lastReviewedAt: number
}

export type ModeFamily = 'reconnaissance' | 'rappel' | 'production'
export type Result = 'reussi' | 'presque' | 'rate'

/** Journal des cartes validées : sert au tableau de bord, aux points et à la série. */
export interface Review {
  id: Id
  gameId: Id
  playerId: Id
  wordId: Id
  mode: string
  family: ModeFamily
  result: Result
  boxBefore: Box
  boxAfter: Box
  points: number
  day: Day
  at: number
}

export interface StoredImage {
  id: Id
  blob: Blob
}

export interface MetaEntry {
  key: string
  value: unknown
}

export type ModeId =
  | 'bon-sens'
  | 'vrai-faux'
  | 'carte-classique'
  | 'mot-cache'
  | 'quel-sens'
  | 'a-toi-la-phrase'
  | 'fais-deviner'
