// Outils de texte : comparaison sans accents ni majuscules, mise en valeur du mot dans sa phrase.

/** « Pièce » et « piece » sont le même mot pour la détection de doublons. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export interface SentenceParts {
  before: string
  match: string
  after: string
  found: boolean
}

/** Découpe la phrase autour du mot (sans tenir compte des majuscules) pour le mettre en valeur. */
export function splitSentence(sentence: string, word: string): SentenceParts {
  const w = word.trim()
  const idx = w ? sentence.toLowerCase().indexOf(w.toLowerCase()) : -1
  if (idx < 0) return { before: sentence, match: '', after: '', found: false }
  return {
    before: sentence.slice(0, idx),
    match: sentence.slice(idx, idx + w.length),
    after: sentence.slice(idx + w.length),
    found: true,
  }
}

/** Remplace le mot de `sentence` par `replacement` (pour fabriquer une phrase absurde). */
export function swapWord(sentence: string, word: string, replacement: string): string | undefined {
  const parts = splitSentence(sentence, word)
  return parts.found ? parts.before + replacement + parts.after : undefined
}
