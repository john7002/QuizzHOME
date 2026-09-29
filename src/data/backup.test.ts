import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { QuizzDb } from './db'
import { backupIsDue, exportBackup, importBackup } from './backup'

describe('sauvegarde', () => {
  it('restaure à l’identique les mots, joueurs, progression et images', async () => {
    const source = new QuizzDb('source')
    await source.words.add({
      id: 'w1',
      kind: 'mot',
      word: 'brumeux',
      sentence: 'Au réveil, le lac était tout brumeux.',
      definition: 'Couvert d’un léger brouillard.',
      category: 'École',
      status: 'actif',
      imageId: 'img1',
      createdAt: 1,
      updatedAt: 1,
    })
    await source.players.add({ id: 'leo', name: 'Léo', color: '#5AD8FF', avatar: 'L', ageGroup: '12-14', isMainLearner: true, createdAt: 1 })
    await source.progress.add({ playerId: 'leo', wordId: 'w1', box: 3, dueDay: '2026-10-03', acquisStreak: 0, misses: 1, lastReviewedAt: 5 })
    await source.images.add({ id: 'img1', blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/webp' }) })

    const zip = await exportBackup(source)

    const target = new QuizzDb('target')
    await target.words.add({ id: 'old', kind: 'mot', word: 'ancien', sentence: '', definition: '', category: 'Lecture', status: 'brouillon', createdAt: 0, updatedAt: 0 })
    await importBackup(zip, target)

    expect(await target.words.toArray()).toEqual(await source.words.toArray())
    expect(await target.players.toArray()).toEqual(await source.players.toArray())
    expect(await target.progress.get(['leo', 'w1'])).toMatchObject({ box: 3, misses: 1 })
    const img = await target.images.get('img1')
    expect(img?.blob.type).toBe('image/webp')
    expect(new Uint8Array(await img!.blob.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]))
  })

  it('rappelle de sauvegarder après 7 jours', () => {
    const now = Date.UTC(2026, 8, 29)
    expect(backupIsDue(undefined, now)).toBe(true)
    expect(backupIsDue(now - 6 * 86_400_000, now)).toBe(false)
    expect(backupIsDue(now - 8 * 86_400_000, now)).toBe(true)
  })
})

describe('ancien format « pour qui ? » (un seul joueur)', () => {
  it('convertit forPlayerId en forPlayerIds à l’import d’une ancienne sauvegarde', async () => {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    zip.file(
      'data.json',
      JSON.stringify({
        format: 1,
        exportedAt: '',
        words: [
          { id: 'a', kind: 'mot', word: 'a', sentence: 'a', definition: 'a', category: 'Lecture', status: 'actif', forPlayerId: 'leo', createdAt: 0, updatedAt: 0 },
          { id: 'b', kind: 'mot', word: 'b', sentence: 'b', definition: 'b', category: 'Lecture', status: 'actif', createdAt: 0, updatedAt: 0 },
        ],
        players: [],
        progress: [],
        reviews: [],
        meta: [],
        images: [],
      }),
    )
    const target = new QuizzDb('ancien-format')
    await importBackup(await zip.generateAsync({ type: 'blob' }), target)
    const a = await target.words.get('a')
    expect(a?.forPlayerIds).toEqual(['leo'])
    expect(a).not.toHaveProperty('forPlayerId')
    expect((await target.words.get('b'))?.forPlayerIds).toBeUndefined()
  })

  it('migre une base existante créée avec la version 1', async () => {
    const { default: Dexie } = await import('dexie')
    const old = new Dexie('base-v1')
    old.version(1).stores({ words: 'id, status, category, kind, forPlayerId, word', players: 'id', progress: '[playerId+wordId], playerId, wordId, dueDay, box', reviews: 'id, gameId, playerId, wordId, day', images: 'id', meta: 'key' })
    await old.table('words').add({ id: 'x', kind: 'mot', word: 'x', sentence: 'x', definition: 'x', category: 'Lecture', status: 'actif', forPlayerId: 'ines', createdAt: 0, updatedAt: 0 })
    old.close()

    const db2 = new QuizzDb('base-v1')
    expect((await db2.words.get('x'))?.forPlayerIds).toEqual(['ines'])
    expect(await db2.words.where('forPlayerIds').equals('ines').count()).toBe(1)
  })
})
