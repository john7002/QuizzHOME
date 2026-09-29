import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../data/db'
import { getSettings } from '../data/repo'
import { DEFAULT_SETTINGS, type Settings } from '../domain/settings'
import { splitSentence } from '../domain/text'
import type { Player, Progress, Review, Word } from '../domain/types'
import { IconBack } from './icons'

export interface AppData {
  words: Word[]
  players: Player[]
  progress: Progress[]
  reviews: Review[]
  settings: Settings
}

/** Toutes les données de l'appareil, tenues à jour en direct. `undefined` pendant le chargement. */
export function useData(): AppData | undefined {
  return useLiveQuery(async () => ({
    words: await db.words.toArray(),
    players: (await db.players.toArray()).sort((a, b) => a.createdAt - b.createdAt),
    progress: await db.progress.toArray(),
    reviews: await db.reviews.toArray(),
    settings: await getSettings(),
  }))
}

export function useSettings(): Settings {
  return useLiveQuery(getSettings) ?? DEFAULT_SETTINGS
}

export function Avatar({ player, size = 52, rotate = 0 }: { player: Pick<Player, 'avatar' | 'color'>; size?: number; rotate?: number }) {
  return (
    <div
      className="avatar"
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: player.color,
        fontSize: size * 0.42,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    >
      {player.avatar}
    </div>
  )
}

/** La phrase du mot, le mot mis en valeur. */
export function Sentence({ sentence, word, hide = false }: { sentence: string; word: string; hide?: boolean }) {
  const parts = splitSentence(sentence, word)
  if (!parts.found) {
    return (
      <>
        {sentence} <span className="mark">{hide ? '…' : word}</span>
      </>
    )
  }
  return (
    <>
      {parts.before}
      <span className="mark">{hide ? '_'.repeat(Math.max(4, Math.min(parts.match.length, 12))) : parts.match}</span>
      {parts.after}
    </>
  )
}

export function BackLink({ to = '/', label = 'Retour' }: { to?: string; label?: string }) {
  return (
    <Link to={to} className="btn btn-icon" aria-label={label}>
      <IconBack />
    </Link>
  )
}

/** URL affichable d'une image stockée dans la base. */
export function useImageUrl(imageId: string | undefined): string | undefined {
  const blob = useLiveQuery(async () => (imageId ? (await db.images.get(imageId))?.blob : undefined), [imageId])
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) {
      setUrl(undefined)
      return
    }
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}

export function Loading() {
  return <main className="screen" aria-busy="true" />
}

export const ROT = [-6, 5, -4, 7, -3, 4]
