import { DEFAULT_SCORES, type ScoreTable } from './scoring'

export interface Settings {
  /** Plafond de cartes par partie (15 à 20 par défaut). */
  maxCards: number
  /** Mots nouveaux par partie (3 à 5). */
  maxNew: number
  sound: boolean
  /** Code de l'Espace parents ; vide = pas de code. */
  parentPin: string
  scores: ScoreTable
}

export const DEFAULT_SETTINGS: Settings = {
  maxCards: 15,
  maxNew: 4,
  sound: false,
  parentPin: '',
  scores: DEFAULT_SCORES,
}
