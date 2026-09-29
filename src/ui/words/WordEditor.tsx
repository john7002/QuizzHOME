// Ajout et modification d'une fiche mot (maquette « Ajouter un mot »).

import { useTrack } from '../useTrack'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../../data/db'
import { deleteWord, findDuplicates, saveWord, setSuspended, storeImage, type WordInput } from '../../data/repo'
import { splitSentence } from '../../domain/text'
import type { Word, WordKind } from '../../domain/types'
import { useData, useImageUrl } from '../common'
import { PlayerPicker } from './PlayerPicker'
import { play } from '../audio'
import { IconCamera, IconCheck, IconChevron, IconClose, IconList, IconPlus } from '../icons'

export const CATEGORIES = ['Lecture', 'École', 'Vie courante']

const list = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

interface Form {
  word: string
  kind: WordKind
  sentence: string
  definition: string
  category: string
  forPlayerIds: string[]
  imageId?: string
  knownSense: string
  synonyms: string
  antonyms: string
  partOfSpeech: string
  family: string
  source: string
  absurdSentence: string
}

const EMPTY: Form = {
  word: '',
  kind: 'mot',
  sentence: '',
  definition: '',
  category: 'Lecture',
  forPlayerIds: [],
  knownSense: '',
  synonyms: '',
  antonyms: '',
  partOfSpeech: '',
  family: '',
  source: '',
  absurdSentence: '',
}

function toForm(w: Word): Form {
  return {
    word: w.word,
    kind: w.kind,
    sentence: w.sentence,
    definition: w.definition,
    category: w.category,
    forPlayerIds: w.forPlayerIds ?? [],
    imageId: w.imageId,
    knownSense: w.knownSense ?? '',
    synonyms: (w.synonyms ?? []).join(', '),
    antonyms: (w.antonyms ?? []).join(', '),
    partOfSpeech: w.partOfSpeech ?? '',
    family: (w.family ?? []).join(', '),
    source: w.source ?? '',
    absurdSentence: w.absurdSentence ?? '',
  }
}

export function WordEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const data = useData()
  const existing = useLiveQuery(async () => (id ? ((await db.words.get(id)) ?? null) : null), [id])
  const [form, setForm] = useState<Form>(EMPTY)
  const [loadedId, setLoadedId] = useState<string>()
  const [more, setMore] = useState(false)
  const [dups, setDups] = useState<Word[]>([])
  const [newSense, setNewSense] = useState(false)
  const [saved, setSaved] = useState<{ word: string; draft: boolean }>()
  const [error, setError] = useState<string>()
  const wordInput = useRef<HTMLInputElement>(null)
  const image = useImageUrl(form.imageId)
  useTrack('aucune')

  useEffect(() => {
    if (existing && existing.id !== loadedId) {
      setForm(toForm(existing))
      setLoadedId(existing.id)
      setMore(!!(existing.knownSense || existing.synonyms?.length || existing.antonyms?.length || existing.partOfSpeech || existing.source || existing.absurdSentence))
    }
  }, [existing, loadedId])

  useEffect(() => {
    const t = setTimeout(() => findDuplicates(form.word, id).then(setDups), 250)
    return () => clearTimeout(t)
  }, [form.word, id])

  if (id && existing === null) {
    return (
      <main className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p className="disp" style={{ fontSize: 24 }}>
          Ce mot n’existe plus.
        </p>
        <Link to="/parents/mots" className="btn">
          Liste des mots
        </Link>
      </main>
    )
  }

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(undefined)
    setError(undefined)
  }

  const main = data?.players.find((p) => p.isMainLearner)
  const dupBox = (w: Word) => {
    const b = data?.progress.find((p) => p.wordId === w.id && p.playerId === main?.id)?.box
    return b === undefined ? 'pas encore joué' : b === 6 ? 'acquis' : `boîte ${b}`
  }
  const drafts = data?.words.filter((w) => w.status === 'brouillon').length ?? 0
  const parts = splitSentence(form.sentence, form.word)
  const kindLabel = form.kind === 'expression' ? `Expression · ${form.category}` : form.category

  async function save(asDraft: boolean) {
    if (!form.word.trim()) return setError('Écris d’abord le mot ou l’expression.')
    if (!form.sentence.trim()) return setError('Ajoute la phrase où il a été rencontré : un mot se révise toujours en contexte.')
    if (!asDraft && !form.definition.trim()) return setError('Il manque la définition. Tu peux aussi garder le mot en brouillon.')
    const input: WordInput = {
      id,
      word: form.word,
      kind: form.kind,
      sentence: form.sentence,
      definition: form.definition,
      category: form.category,
      forPlayerIds: form.forPlayerIds.length ? form.forPlayerIds : undefined,
      imageId: form.imageId,
      knownSense: form.knownSense.trim() || undefined,
      synonyms: list(form.synonyms),
      antonyms: list(form.antonyms),
      family: list(form.family),
      partOfSpeech: form.partOfSpeech.trim() || undefined,
      source: form.source.trim() || undefined,
      absurdSentence: form.absurdSentence.trim() || undefined,
      packId: existing?.packId,
    }
    const w = await saveWord(input)
    if (id) {
      navigate(-1)
      return
    }
    play('ajout')
    setSaved({ word: w.word, draft: w.status === 'brouillon' })
  }

  function again() {
    setForm({ ...EMPTY, category: form.category, forPlayerIds: form.forPlayerIds })
    setSaved(undefined)
    setMore(false)
    setNewSense(false)
    wordInput.current?.focus()
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return
    try {
      set('imageId', await storeImage(file))
    } catch {
      setError('Impossible de lire cette photo.')
    }
  }

  function startNewSense(other: Word) {
    setNewSense(true)
    setMore(true)
    if (!form.knownSense) set('knownSense', other.definition)
  }

  return (
    <main className="screen">
      <header className="topbar">
        <button className="btn btn-icon" aria-label="Fermer" onClick={() => navigate(-1)}>
          <IconClose />
        </button>
        <h1>
          {id ? 'Modifier ' : 'Nouveau '}
          <span style={{ color: 'var(--coral)' }}>{id ? 'la fiche' : 'mot'}</span>
        </h1>
        <div className="spacer" />
        {!id && (
          <>
            {drafts > 0 && (
              <Link to="/parents/mots?filtre=brouillon" className="btn btn-sm btn-outline" style={{ borderColor: 'var(--gold)' }}>
                <span className="avatar" style={{ minWidth: 26, height: 26, borderRadius: 13, background: 'var(--gold)', fontFamily: 'var(--font-body)', fontSize: 14 }}>
                  {drafts}
                </span>
                Brouillons à compléter
              </Link>
            )}
            <Link to="/ajouter/lot" className="btn btn-sm">
              <IconList /> Ajout par lot
            </Link>
          </>
        )}
      </header>

      <div className="grid-2" style={{ flexGrow: 1 }}>
        <section className="panel">
          <div className="field">
            <label htmlFor="mot" className="label">
              Nouveau mot ou expression
            </label>
            <div className="row wrap" style={{ gap: 10, alignItems: 'stretch' }}>
              <input
                id="mot"
                ref={wordInput}
                className="input input-big"
                style={{ flex: '1 1 260px', width: 'auto' }}
                autoFocus={!id}
                autoComplete="off"
                autoCapitalize="none"
                placeholder="ex. brumeux, avoir le cafard…"
                value={form.word}
                onChange={(e) => {
                  const v = e.target.value
                  set('word', v)
                  if (!id) set('kind', v.trim().includes(' ') ? 'expression' : 'mot')
                }}
              />
              <div className="seg" role="radiogroup" aria-label="Type" style={{ ['--seg-on' as string]: 'var(--coral)' }}>
                {(['mot', 'expression'] as const).map((k) => (
                  <button key={k} role="radio" aria-checked={form.kind === k} onClick={() => set('kind', k)}>
                    {k === 'mot' ? 'Mot' : 'Expression'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="field">
            <label htmlFor="phrase" className="label">
              La phrase où on l’a rencontré
            </label>
            <textarea id="phrase" className="input" rows={2} placeholder="Le ciel était maussade ce matin." value={form.sentence} onChange={(e) => set('sentence', e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="def" className="label">
              Le sens, avec ses mots à lui
            </label>
            <textarea id="def" className="input" rows={2} placeholder="Triste et gris, qui ne donne pas envie." value={form.definition} onChange={(e) => set('definition', e.target.value)} />
          </div>

          <div className="row wrap" style={{ gap: 22, alignItems: 'flex-start' }}>
            <div className="field">
              <span className="label">Catégorie</span>
              <div className="row wrap" style={{ gap: 6 }}>
                {CATEGORIES.map((c) => (
                  <button key={c} className="chip-btn" aria-pressed={form.category === c} onClick={() => set('category', c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {data && data.players.length > 1 && (
              <PlayerPicker players={data.players} value={form.forPlayerIds} onChange={(v) => set('forPlayerIds', v)} />
            )}
          </div>

          <button
            className="btn btn-outline"
            aria-expanded={more}
            onClick={() => setMore(!more)}
            style={{ marginTop: 'auto', justifyContent: 'space-between', borderStyle: 'dashed', minHeight: 52, fontSize: 16 }}
          >
            <span style={{ textAlign: 'left' }}>
              Plus de détails <span className="muted" style={{ fontWeight: 500 }}>· synonymes, contraire, classe, source, sens déjà connu</span>
            </span>
            <IconChevron style={{ transform: `rotate(${more ? 180 : 0}deg)`, transition: 'transform .25s', flexShrink: 0 }} />
          </button>
          {more && (
            <div className="rise" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              <input className="input input-sm" aria-label="Synonymes" placeholder="Synonymes : morose, sombre" value={form.synonyms} onChange={(e) => set('synonyms', e.target.value)} />
              <input className="input input-sm" aria-label="Contraires" placeholder="Contraire : joyeux, radieux" value={form.antonyms} onChange={(e) => set('antonyms', e.target.value)} />
              <input className="input input-sm" aria-label="Classe grammaticale" placeholder="Classe : adjectif, nom, verbe…" value={form.partOfSpeech} onChange={(e) => set('partOfSpeech', e.target.value)} />
              <input className="input input-sm" aria-label="Famille de mots" placeholder="Famille : la maussaderie" value={form.family} onChange={(e) => set('family', e.target.value)} />
              <input className="input input-sm" aria-label="Source" placeholder="Source : leçon de sciences du 29/09" value={form.source} onChange={(e) => set('source', e.target.value)} />
              <input
                className="input input-sm"
                aria-label="Sens déjà connu"
                placeholder="Sens déjà connu (si c’est un sens nouveau)"
                value={form.knownSense}
                onChange={(e) => set('knownSense', e.target.value)}
                style={newSense ? { borderColor: 'var(--gold)' } : undefined}
              />
              <input
                className="input input-sm"
                aria-label="Phrase absurde pour Vrai ou faux"
                placeholder="Phrase absurde (Vrai ou faux) : Le ciel était maussade de joie."
                value={form.absurdSentence}
                onChange={(e) => set('absurdSentence', e.target.value)}
                style={{ gridColumn: '1 / -1' }}
              />
            </div>
          )}
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {dups.length > 0 && !newSense && (
            <div className="warn shake" role="status">
              <span style={{ fontSize: 17, lineHeight: 1.3 }}>
                « {dups[0].word} » est déjà dans le paquet ({dupBox(dups[0])}). C’est un autre sens ?
              </span>
              <div className="row wrap" style={{ gap: 8 }}>
                <button className="btn btn-sm" style={{ background: 'var(--ink)', color: 'var(--gold)' }} onClick={() => startNewSense(dups[0])}>
                  Ajouter un sens nouveau
                </button>
                <Link to={`/parents/mots/${dups[0].id}`} className="btn btn-sm btn-outline" style={{ borderColor: 'var(--ink)', color: 'var(--ink)' }}>
                  Voir la fiche
                </Link>
              </div>
            </div>
          )}

          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="eyebrow" style={{ fontSize: 14, letterSpacing: 1.5 }}>
              Aperçu de la carte
            </span>
            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', position: 'relative', padding: '0 10px 10px 0' }}>
              <div className="card" style={{ width: '100%', padding: '24px 26px', borderRadius: 30, gap: 14, boxShadow: '10px 10px 0 var(--coral)', transform: 'none' }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="row wrap" style={{ gap: 8 }}>
                    <span className="card-chip">{kindLabel}</span>
                    {(form.knownSense || newSense) && <span className="card-chip gold">Sens nouveau</span>}
                  </div>
                  {image ? (
                    <div className="pop" style={{ position: 'relative', flexShrink: 0, padding: '6px 6px 14px', background: '#fff', borderRadius: 6, boxShadow: '0 4px 12px rgba(18,15,42,.25)', transform: 'rotate(4deg)' }}>
                      <img src={image} alt="Photo du mot" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 3, display: 'block' }} />
                      <button
                        aria-label="Retirer la photo"
                        onClick={() => set('imageId', undefined)}
                        className="avatar"
                        style={{ position: 'absolute', top: -14, right: -14, width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--card)', background: 'var(--ink)', color: 'var(--text)', padding: 0 }}
                      >
                        <IconClose size={14} />
                      </button>
                    </div>
                  ) : (
                    <label
                      style={{ position: 'relative', flexShrink: 0, width: 96, height: 96, borderRadius: 18, border: '3px dashed #9B8FD6', background: '#F1ECFF', color: 'var(--card-chip-ink)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: 'pointer', transform: 'rotate(4deg)' }}
                    >
                      <input type="file" accept="image/*" className="sr-only" aria-label="Ajouter une photo (facultatif)" onChange={(e) => onPhoto(e.target.files?.[0])} />
                      <IconCamera />
                      <span style={{ fontSize: 14, fontWeight: 800 }}>Photo</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#5B4FA8' }}>facultatif</span>
                    </label>
                  )}
                </div>
                <p className="disp" style={{ fontSize: 24, lineHeight: 1.35, fontWeight: 500 }}>
                  {parts.found ? (
                    <>
                      {parts.before}
                      <span className="mark" style={{ fontSize: '1em', padding: '0 8px' }}>
                        {parts.match}
                      </span>
                      {parts.after}
                    </>
                  ) : (
                    <>
                      {form.sentence}{' '}
                      <span className="mark" style={{ fontSize: '1em', padding: '0 8px' }}>
                        {form.word || '…'}
                      </span>
                    </>
                  )}
                </p>
                {form.word.trim() && form.sentence.trim() && !parts.found && (
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#8A3A1F' }}>Le mot n’apparaît pas tel quel dans la phrase : il ne sera pas mis en valeur, et « Le mot caché » ne pourra pas l’utiliser.</span>
                )}
                <div style={{ borderTop: '3px dashed #D6CEF5', paddingTop: 12, fontSize: 19, fontWeight: 600, lineHeight: 1.3 }}>
                  {form.definition || <span style={{ color: '#8C85B8' }}>Le sens apparaîtra ici…</span>}
                </div>
              </div>

              {saved && (
                <div
                  role="status"
                  style={{ position: 'absolute', inset: -6, borderRadius: 32, background: 'var(--ink)', border: '3px solid var(--lime)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', padding: 20 }}
                >
                  <div className="pop avatar" style={{ width: 84, height: 84, borderRadius: 28, background: 'var(--lime)', transform: 'rotate(-6deg)' }}>
                    <IconCheck size={46} />
                  </div>
                  <span className="disp pop" style={{ fontSize: 30, fontWeight: 800 }}>
                    {saved.draft ? 'Noté !' : 'Ajouté !'}
                  </span>
                  <span className="muted" style={{ fontSize: 17, lineHeight: 1.4, maxWidth: 340 }}>
                    {saved.draft
                      ? `« ${saved.word} » attend sa définition dans les brouillons. Il n’entrera pas en partie avant.`
                      : `« ${saved.word} » arrive en boîte 1 : il sera joué dès la prochaine partie.`}
                  </span>
                  <button className="btn btn-coral" onClick={again}>
                    <IconPlus size={20} /> Ajouter un autre mot
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <p role="alert" style={{ color: 'var(--coral)', fontWeight: 700, fontSize: 17 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary disp" style={{ minHeight: 76, borderRadius: 26, fontSize: 24 }} onClick={() => save(false)}>
              <IconCheck size={28} /> Enregistrer la fiche
            </button>
            {!id && (
              <button className="btn btn-outline" style={{ minHeight: 52 }} onClick={() => save(true)}>
                Garder en brouillon <span className="muted" style={{ fontWeight: 500 }}>· mot + phrase suffisent</span>
              </button>
            )}
            {id && existing && (
              <div className="row wrap" style={{ gap: 10 }}>
                <button className="btn btn-sm btn-outline" onClick={() => setSuspended(existing.id, existing.status !== 'suspendu')}>
                  {existing.status === 'suspendu' ? 'Remettre en jeu' : 'Suspendre (sans perdre la progression)'}
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={async () => {
                    if (window.confirm(`Supprimer « ${existing.word} » et sa progression ?`)) {
                      await deleteWord(existing.id)
                      navigate(-1)
                    }
                  }}
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
