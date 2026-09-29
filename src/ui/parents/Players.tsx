// Joueurs : prénom, couleur, avatar, tranche d'âge, apprenant principal.

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { deletePlayer, PLAYER_COLORS, savePlayer } from '../../data/repo'
import type { AgeGroup } from '../../domain/types'
import { Avatar, BackLink, ROT, useData } from '../common'
import { IconPlus } from '../icons'

const AGE_LABEL: Record<AgeGroup, string> = { '12-14': '12 – 14 ans', '15-18': '15 – 18 ans', adulte: 'Adulte' }
const AVATARS = ['🦊', '🐼', '🦉', '🐙', '🦁', '🐸', '🐧', '🦄', '🐯', '🐨', '🐲', '🐝']

export function PlayerList() {
  const data = useData()
  if (!data) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
      {data.players.length === 0 && <p className="empty">Aucun joueur pour l’instant.</p>}
      {data.players.map((p, k) => (
        <Link
          key={p.id}
          to={`/parents/joueurs/${p.id}`}
          className="row"
          style={{ minHeight: 84, padding: '0 18px', borderRadius: 22, background: 'var(--surface-2)', color: 'var(--text)', textDecoration: 'none', gap: 14 }}
        >
          <Avatar player={p} rotate={ROT[k % ROT.length]} />
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>{p.name}</span>
            <span className="muted" style={{ fontSize: 15 }}>
              {AGE_LABEL[p.ageGroup]}
              {p.isMainLearner ? ' · apprenant principal' : ''}
            </span>
          </span>
        </Link>
      ))}
      <Link to="/parents/joueurs/nouveau" className="btn btn-coral" style={{ alignSelf: 'flex-start' }}>
        <IconPlus size={22} /> Ajouter un joueur
      </Link>
    </div>
  )
}

export function PlayerEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const data = useData()
  const [params] = useSearchParams()
  const back = params.has('accueil') ? '/' : '/parents/joueurs'
  const isNew = !id || id === 'nouveau'
  const existing = isNew ? undefined : data?.players.find((p) => p.id === id)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PLAYER_COLORS[0])
  const [avatar, setAvatar] = useState('')
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('12-14')
  const [isMainLearner, setMain] = useState(false)
  const [loaded, setLoaded] = useState(false)

  function resetForNew(count: number, usedColors: string[]) {
    setName('')
    setAvatar('')
    setColor(PLAYER_COLORS.find((c) => !usedColors.includes(c)) ?? PLAYER_COLORS[0])
    setMain(count === 0)
    setAgeGroup(count === 0 ? '12-14' : 'adulte')
  }

  useEffect(() => {
    if (!data || loaded) return
    if (existing) {
      setName(existing.name)
      setColor(existing.color)
      setAvatar(existing.avatar)
      setAgeGroup(existing.ageGroup)
      setMain(existing.isMainLearner)
    } else {
      resetForNew(data.players.length, data.players.map((p) => p.color))
    }
    setLoaded(true)
  }, [data, existing, loaded])

  if (!data || !loaded) return null
  const first = data.players.length === 0
  const shownAvatar = avatar || name.trim().charAt(0).toUpperCase() || '?'

  async function save(addAnother: boolean) {
    if (!name.trim()) return
    await savePlayer({ id: existing?.id, name: name.trim(), color, avatar: shownAvatar, ageGroup, isMainLearner })
    if (addAnother) resetForNew(data!.players.length + 1, [...data!.players.map((p) => p.color), color])
    else navigate(back)
  }

  return (
    <main className="screen">
      <header className="topbar">
        <BackLink to={back} />
        <h1>{existing ? `Modifier ${existing.name}` : first ? 'Premier joueur' : 'Nouveau joueur'}</h1>
      </header>
      <section className="panel" style={{ maxWidth: 760, gap: 22 }}>
        <div className="row" style={{ gap: 20 }}>
          <Avatar player={{ avatar: shownAvatar, color }} size={96} rotate={-6} />
          <div className="field" style={{ flexGrow: 1 }}>
            <label htmlFor="prenom" className="label">
              Prénom
            </label>
            <input id="prenom" className="input input-big" autoFocus={isNew} value={name} onChange={(e) => setName(e.target.value)} placeholder="Léo" autoComplete="off" />
          </div>
        </div>

        <div className="field">
          <span className="label">Couleur</span>
          <div className="row wrap" style={{ gap: 10 }}>
            {PLAYER_COLORS.map((c) => (
              <button
                key={c}
                aria-label={`Couleur ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                style={{ width: 56, height: 56, borderRadius: 18, background: c, border: color === c ? '4px solid var(--text)' : '4px solid transparent' }}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <span className="label">Avatar</span>
          <div className="row wrap" style={{ gap: 8 }}>
            <button className="chip-btn" aria-pressed={!avatar} onClick={() => setAvatar('')} style={{ minWidth: 56 }}>
              Initiale
            </button>
            {AVATARS.map((a) => (
              <button key={a} className="chip-btn" aria-pressed={avatar === a} onClick={() => setAvatar(a)} style={{ minWidth: 56, fontSize: 26 }} aria-label={`Avatar ${a}`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="label">Âge (règle le barème des points)</span>
          <div className="seg" role="radiogroup" style={{ alignSelf: 'flex-start' }}>
            {(Object.keys(AGE_LABEL) as AgeGroup[]).map((a) => (
              <button key={a} role="radio" aria-checked={ageGroup === a} onClick={() => setAgeGroup(a)}>
                {AGE_LABEL[a]}
              </button>
            ))}
          </div>
        </div>

        <label className="row" style={{ gap: 14, fontSize: 18, fontWeight: 600, cursor: 'pointer' }}>
          <input type="checkbox" checked={isMainLearner} onChange={(e) => setMain(e.target.checked)} style={{ width: 28, height: 28, accentColor: 'var(--lime)' }} />
          Apprenant principal : les mots de la partie sont choisis d’abord pour lui ou elle
        </label>

        <div className="row wrap" style={{ gap: 12 }}>
          <button className="btn btn-primary" onClick={() => save(false)} disabled={!name.trim()}>
            Enregistrer
          </button>
          {isNew && (
            <button className="btn btn-outline" onClick={() => save(true)} disabled={!name.trim()}>
              Enregistrer et ajouter un autre joueur
            </button>
          )}
          {existing && (
            <button
              className="btn btn-danger"
              style={{ marginLeft: 'auto' }}
              onClick={async () => {
                if (window.confirm(`Supprimer ${existing.name}, sa progression et ses points ?`)) {
                  await deletePlayer(existing.id)
                  navigate('/parents/joueurs')
                }
              }}
            >
              Supprimer
            </button>
          )}
        </div>
      </section>
    </main>
  )
}
