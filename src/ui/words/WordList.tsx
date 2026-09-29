// Liste des mots : recherche, filtres, accès à la fiche.

import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { normalize } from '../../domain/text'
import type { Word } from '../../domain/types'
import { useData } from '../common'
import { IconList, IconPlus } from '../icons'
import { CATEGORIES } from './WordEditor'

const STATUS_LABEL: Record<Word['status'], string> = { actif: 'En jeu', brouillon: 'À compléter', suspendu: 'Suspendu' }
const STATUS_COLOR: Record<Word['status'], string> = { actif: 'var(--lime)', brouillon: 'var(--gold)', suspendu: 'var(--text-faint)' }

export function WordList() {
  const data = useData()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const filter = params.get('filtre') ?? ''
  const category = params.get('categorie') ?? ''
  const box = params.get('boite') ?? ''
  const playerId = params.get('joueur') ?? data?.players.find((p) => p.isMainLearner)?.id ?? data?.players[0]?.id ?? ''

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const rows = useMemo(() => {
    if (!data) return []
    const q = normalize(query)
    const boxOf = (w: Word) => data.progress.find((p) => p.wordId === w.id && p.playerId === playerId)?.box
    return data.words
      .filter((w) => !q || normalize(w.word).includes(q) || normalize(w.definition).includes(q))
      .filter((w) => !filter || (filter === 'expression' ? w.kind === 'expression' : filter === 'mot' ? w.kind === 'mot' : w.status === filter))
      .filter((w) => !category || w.category === category)
      .filter((w) => !box || String(boxOf(w) ?? 0) === box)
      .map((w) => ({ w, box: boxOf(w) }))
      .sort((a, b) => a.w.word.localeCompare(b.w.word, 'fr'))
  }, [data, query, filter, category, box, playerId])

  if (!data) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="row wrap" style={{ gap: 10 }}>
        <input className="input input-sm" style={{ flex: '1 1 240px', width: 'auto' }} type="search" placeholder="Rechercher un mot ou une définition" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Rechercher" />
        <Link to="/ajouter" className="btn btn-coral btn-sm">
          <IconPlus size={20} /> Ajouter
        </Link>
        <Link to="/ajouter/lot" className="btn btn-sm">
          <IconList /> Par lot
        </Link>
      </div>

      <div className="row wrap" style={{ gap: 8 }}>
        <select className="input input-sm" style={{ width: 'auto' }} value={filter} onChange={(e) => setParam('filtre', e.target.value)} aria-label="État ou type">
          <option value="">Tous les mots</option>
          <option value="brouillon">À compléter</option>
          <option value="actif">En jeu</option>
          <option value="suspendu">Suspendus</option>
          <option value="mot">Mots</option>
          <option value="expression">Expressions</option>
        </select>
        <select className="input input-sm" style={{ width: 'auto' }} value={category} onChange={(e) => setParam('categorie', e.target.value)} aria-label="Catégorie">
          <option value="">Toutes catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        {data.players.length > 0 && (
          <select className="input input-sm" style={{ width: 'auto' }} value={playerId} onChange={(e) => setParam('joueur', e.target.value)} aria-label="Boîtes de quel joueur">
            {data.players.map((p) => (
              <option key={p.id} value={p.id}>
                Boîtes de {p.name}
              </option>
            ))}
          </select>
        )}
        <select className="input input-sm" style={{ width: 'auto' }} value={box} onChange={(e) => setParam('boite', e.target.value)} aria-label="Boîte">
          <option value="">Toutes les boîtes</option>
          <option value="0">Pas encore joué</option>
          {[1, 2, 3, 4, 5].map((b) => (
            <option key={b} value={b}>
              Boîte {b}
            </option>
          ))}
          <option value="6">Acquis</option>
        </select>
        <span className="muted" style={{ marginLeft: 'auto', fontSize: 15 }}>
          {rows.length} fiche{rows.length > 1 ? 's' : ''}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="empty">Aucun mot ne correspond.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map(({ w, box: b }) => (
            <li key={w.id}>
              <Link
                to={`/parents/mots/${w.id}`}
                style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'center', padding: '12px 16px', borderRadius: 18, background: 'var(--surface-2)', color: 'var(--text)', textDecoration: 'none', minHeight: 60 }}
              >
                <span style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 19, fontWeight: 700 }}>{w.word}</span>
                  <span className="muted" style={{ fontSize: 15, marginLeft: 10 }}>
                    {w.category}
                    {w.kind === 'expression' ? ' · expression' : ''}
                  </span>
                  <span className="muted" style={{ display: 'block', fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {w.definition || w.sentence || '—'}
                  </span>
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: STATUS_COLOR[w.status] }}>{STATUS_LABEL[w.status]}</span>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {b === undefined ? 'pas encore joué' : b === 6 ? 'acquis' : `boîte ${b}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
