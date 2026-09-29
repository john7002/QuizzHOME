// Ajout par lot : coller les mots d'une leçon ou d'un livre d'un coup.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addBatch, parseBatch } from '../../data/repo'
import { BackLink, useData } from '../common'
import { PlayerPicker } from './PlayerPicker'
import { IconCheck } from '../icons'
import { CATEGORIES } from './WordEditor'

export function BatchAdd() {
  const data = useData()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [category, setCategory] = useState('École')
  const [forPlayerIds, setForPlayerIds] = useState<string[]>([])
  const [done, setDone] = useState<number>()
  const lines = parseBatch(text)
  const complete = lines.filter((l) => l.sentence && l.definition).length

  async function save() {
    const n = await addBatch(lines, { category, forPlayerIds: forPlayerIds.length ? forPlayerIds : undefined })
    setDone(n)
    setText('')
  }

  return (
    <main className="screen">
      <header className="topbar">
        <BackLink to="/ajouter" />
        <h1>
          Ajout <span style={{ color: 'var(--coral)' }}>par lot</span>
        </h1>
      </header>

      <div className="grid-2" style={{ flexGrow: 1 }}>
        <section className="panel">
          <label htmlFor="lot" className="label">
            Un mot par ligne, ou « mot ; phrase ; définition »
          </label>
          <textarea
            id="lot"
            className="input"
            style={{ flexGrow: 1, minHeight: 280, fontSize: 18 }}
            autoFocus
            autoCapitalize="none"
            placeholder={'brumeux ; Au réveil, le lac était tout brumeux. ; Couvert d’un léger brouillard.\nmaussade\navoir le cafard ; Depuis la rentrée, il a le cafard.'}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setDone(undefined)
            }}
          />
          <div className="row wrap" style={{ gap: 22, alignItems: 'flex-start' }}>
            <div className="field">
              <span className="label">Catégorie</span>
              <div className="row wrap" style={{ gap: 6 }}>
                {CATEGORIES.map((c) => (
                  <button key={c} className="chip-btn" aria-pressed={category === c} onClick={() => setCategory(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {data && data.players.length > 1 && <PlayerPicker players={data.players} value={forPlayerIds} onChange={setForPlayerIds} />}
          </div>
        </section>

        <section className="panel">
          <h2>Aperçu</h2>
          {done !== undefined ? (
            <div className="rise" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
              <p className="disp" style={{ fontSize: 26, fontWeight: 800 }}>
                {done} mot{done > 1 ? 's' : ''} ajouté{done > 1 ? 's' : ''} !
              </p>
              <p className="muted" style={{ fontSize: 17 }}>
                Les mots sans phrase ou sans définition sont dans les brouillons : complète-les pour qu’ils entrent en partie.
              </p>
              <button className="btn" onClick={() => navigate('/parents/mots?filtre=brouillon')}>
                Voir les brouillons
              </button>
            </div>
          ) : lines.length === 0 ? (
            <p className="muted" style={{ fontSize: 17 }}>
              Colle ou tape la liste à gauche. Les lignes avec seulement le mot deviennent des brouillons à compléter.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 17, fontWeight: 600 }}>
                {lines.length} ligne{lines.length > 1 ? 's' : ''} · {complete} complète{complete > 1 ? 's' : ''} · {lines.length - complete} brouillon
                {lines.length - complete > 1 ? 's' : ''}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', maxHeight: 420 }}>
                {lines.map((l, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderRadius: 14, background: 'var(--surface-2)', borderLeft: 'none' }}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: 18 }}>{l.word}</strong>
                      <span style={{ fontSize: 13, fontWeight: 700, color: l.sentence && l.definition ? 'var(--lime)' : 'var(--gold)' }}>
                        {l.sentence && l.definition ? 'complet' : 'brouillon'}
                      </span>
                    </div>
                    {l.sentence && <div className="muted" style={{ fontSize: 15 }}>{l.sentence}</div>}
                    {l.definition && <div style={{ fontSize: 15 }}>{l.definition}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="spacer" />
          <button className="btn btn-primary disp" style={{ minHeight: 76, fontSize: 22 }} disabled={lines.length === 0} onClick={save}>
            <IconCheck size={26} /> Ajouter {lines.length || ''} mot{lines.length > 1 ? 's' : ''}
          </button>
        </section>
      </div>
    </main>
  )
}
