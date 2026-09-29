// Export / import du paquet complet : sert de sauvegarde et de transfert entre appareils.
// Format : un .zip contenant data.json (toutes les tables sauf les images) et images/<id>.

import JSZip from 'jszip'
import { db, getMeta, migrateWord, setMeta, type QuizzDb } from './db'
import { toDay } from '../domain/days'

export const BACKUP_FORMAT = 1
export const BACKUP_REMINDER_DAYS = 7
const LAST_BACKUP_KEY = 'lastBackupAt'

interface BackupData {
  format: number
  exportedAt: string
  words: unknown[]
  players: unknown[]
  progress: unknown[]
  reviews: unknown[]
  meta: unknown[]
  images: { id: string; type: string }[]
}

export async function exportBackup(database: QuizzDb = db): Promise<Blob> {
  const zip = new JSZip()
  const images = await database.images.toArray()
  const data: BackupData = {
    format: BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    words: await database.words.toArray(),
    players: await database.players.toArray(),
    progress: await database.progress.toArray(),
    reviews: await database.reviews.toArray(),
    meta: (await database.meta.toArray()).filter((m) => m.key !== LAST_BACKUP_KEY),
    images: images.map((i) => ({ id: i.id, type: i.blob.type })),
  }
  zip.file('data.json', JSON.stringify(data))
  for (const img of images) zip.file(`images/${img.id}`, await img.blob.arrayBuffer())
  return zip.generateAsync({ type: 'blob', mimeType: 'application/zip' })
}

/** Remplace toutes les données de l'appareil par celles de la sauvegarde. */
export async function importBackup(file: Blob, database: QuizzDb = db): Promise<void> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const json = await zip.file('data.json')?.async('string')
  if (!json) throw new Error('Fichier de sauvegarde invalide : data.json manquant.')
  const data = JSON.parse(json) as BackupData
  if (data.format > BACKUP_FORMAT) {
    throw new Error('Cette sauvegarde vient d’une version plus récente de QUIZZHOME. Mets l’application à jour.')
  }

  const images = await Promise.all(
    data.images.map(async ({ id, type }) => {
      const bytes = await zip.file(`images/${id}`)?.async('arraybuffer')
      if (!bytes) throw new Error(`Image manquante dans la sauvegarde : ${id}`)
      return { id, blob: new Blob([bytes], { type }) }
    }),
  )

  const tables = [database.words, database.players, database.progress, database.reviews, database.images, database.meta]
  await database.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()))
    data.words.forEach((w) => migrateWord(w as Record<string, unknown>))
    await database.words.bulkAdd(data.words as never[])
    await database.players.bulkAdd(data.players as never[])
    await database.progress.bulkAdd(data.progress as never[])
    await database.reviews.bulkAdd(data.reviews as never[])
    await database.meta.bulkAdd(data.meta as never[])
    await database.images.bulkAdd(images)
  })
}

export function backupFileName(date = new Date()): string {
  return `quizzhome-${toDay(date)}.zip`
}

/**
 * Propose le fichier via le menu de partage (iPad : « Enregistrer dans Fichiers » → « Sur mon iPad » ou iCloud Drive),
 * sinon le télécharge (ordinateur).
 */
export async function saveBackup(): Promise<void> {
  const blob = await exportBackup()
  const file = new File([blob], backupFileName(), { type: 'application/zip' })
  // Menu de partage sur tablette et téléphone ; simple téléchargement sur ordinateur.
  const touch = navigator.maxTouchPoints > 1
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Sauvegarde QUIZZHOME' })
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return
      download(file)
    }
  } else {
    download(file)
  }
  await setMeta(LAST_BACKUP_KEY, Date.now())
}

function download(file: File) {
  const url = URL.createObjectURL(file)
  const a = Object.assign(document.createElement('a'), { href: url, download: file.name })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function lastBackupAt(): Promise<number | undefined> {
  return getMeta<number>(LAST_BACKUP_KEY)
}

export function backupIsDue(last: number | undefined, now = Date.now()): boolean {
  return last === undefined || now - last > BACKUP_REMINDER_DAYS * 86_400_000
}
