// Tableau de bord d'un joueur (maquette « Progrès »).

import { useTrack } from '../useTrack'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { addDays, toDay } from '../../domain/days'
import { dashboard, nextMilestone, streak } from '../../domain/stats'
import type { Box } from '../../domain/types'
import { Avatar, BackLink, Loading, useData } from '../common'
import { IconFlame, IconStar } from '../icons'

const BOXES: { box: Box; label: string; color: string; hint: string }[] = [
  { box: 1, label: 'Boîte 1', color: '#FF7A59', hint: 'demain' },
  { box: 2, label: 'Boîte 2', color: '#FFC53D', hint: '2 jours' },
  { box: 3, label: 'Boîte 3', color: '#5AD8FF', hint: '4 jours' },
  { box: 4, label: 'Boîte 4', color: '#9B7BFF', hint: '8 jours' },
  { box: 5, label: 'Boîte 5', color: '#E2FF9A', hint: '16 jours' },
  { box: 6, label: 'Acquis', color: '#C8F55A', hint: '30 jours' },
]

export function Progress() {
  const { id } = useParams()
  const data = useData()
  const [view, setView] = useState<'simple' | 'parents'>('simple')
  useTrack('menu')
  if (!data) return <Loading />
  const player = data.players.find((p) => p.id === id)
  if (!player) {
    return (
      <main className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p>Joueur introuvable.</p>
        <Link to="/" className="btn">
          Accueil
        </Link>
      </main>
    )
  }

  const today = toDay()
  const dash = dashboard(data.progress, data.reviews, player.id, today)
  const s = streak(dash.playedDays.concat(data.reviews.filter((r) => r.playerId === player.id).map((r) => r.day)), today)
  const milestone = nextMilestone(dash.acquired)
  const maxBox = Math.max(1, ...Object.values(dash.boxes))
  const wordName = (wid: string) => data.words.find((w) => w.id === wid)?.word ?? '—'
  const played = new Set(dash.playedDays)
  const jokers = new Set(s.jokerDays)
  const days = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29))

  const myReviews = data.reviews.filter((r) => r.playerId === player.id)
  const successRate = (family: string) => {
    const rs = myReviews.filter((r) => r.family === family)
    return rs.length ? Math.round((rs.filter((r) => r.result === 'reussi').length / rs.length) * 100) : undefined
  }

  return (
    <main className="screen">
      <header className="topbar">
        <BackLink />
        <span className="bob">
          <Avatar player={player} size={68} rotate={-6} />
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h1>{player.name}</h1>
          <span className="muted" style={{ fontSize: 16 }}>
            {player.isMainLearner ? 'Apprenant principal' : 'Joueur'}
          </span>
        </div>
        <div className="spacer" />
        <div className="seg" role="radiogroup" aria-label="Vue" style={{ ['--seg-on' as string]: 'var(--cyan)' }}>
          <button role="radio" aria-checked={view === 'simple'} onClick={() => setView('simple')}>
            Ma vue
          </button>
          <button role="radio" aria-checked={view === 'parents'} onClick={() => setView('parents')}>
            Vue parents
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <Tile label="Mots acquis" highlight>
          <span className="disp" style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>
            {dash.acquired}
          </span>
        </Tile>
        <Tile label="En route">
          <span className="disp" style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>
            {dash.inProgress}
          </span>
        </Tile>
        <Tile label="Série" border="var(--coral)">
          <span className="row" style={{ gap: 10 }}>
            <span className="disp" style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>
              {s.days}
            </span>
            <span style={{ fontSize: 18, fontWeight: 700 }}>jour{s.days > 1 ? 's' : ''}</span>
            <span style={{ marginLeft: 'auto' }}>
              <IconFlame size={34} className="flicker" />
            </span>
          </span>
        </Tile>
        <Tile label="Prochain palier" border="var(--gold)">
          <span className="row" style={{ gap: 10 }}>
            <span className="disp" style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>
              {milestone ?? '★'}
            </span>
            {milestone && (
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--gold)' }}>
                plus que {milestone - dash.acquired} !
              </span>
            )}
          </span>
        </Tile>
      </div>

      <div className="grid-2" style={{ flexGrow: 1, ['--cols' as string]: '1.35fr 1fr' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <section className="panel" style={{ flexGrow: 1 }}>
            <div className="row wrap" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2>Mes boîtes</h2>
              <span className="muted" style={{ fontSize: 15 }}>
                Chaque bonne réponse fait grimper le mot d’une marche
              </span>
            </div>
            <div style={{ flexGrow: 1, minHeight: 240, display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 10, alignItems: 'end' }}>
              {BOXES.map((b, k) => (
                <div key={b.box} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span className="disp" style={{ fontSize: 24, fontWeight: 800, color: b.color }}>
                    {dash.boxes[b.box]}
                  </span>
                  <div
                    className="bar"
                    style={{ width: '100%', height: 40 + (dash.boxes[b.box] / maxBox) * 160, borderRadius: '16px 16px 6px 6px', background: b.color, animationDelay: `${0.1 + k * 0.1}s`, display: 'flex', justifyContent: 'center', paddingTop: 10, color: 'var(--ink)' }}
                  >
                    {b.box === 6 && <IconStar size={28} />}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, textAlign: 'center' }}>{b.label}</span>
                  <span className="muted" style={{ fontSize: 12, textAlign: 'center' }}>
                    {b.hint}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Mots acquis, semaine après semaine</h2>
            <WeeklyChart points={dash.acquiredByWeek} />
          </section>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <section className="panel">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2>30 derniers jours</h2>
              <span className="muted" style={{ fontSize: 15 }}>
                {played.size} jour{played.size > 1 ? 's' : ''} joué{played.size > 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, minmax(0, 1fr))', gap: 6 }}>
              {days.map((d) => (
                <div
                  key={d}
                  title={d}
                  style={{ aspectRatio: '1', borderRadius: 8, background: played.has(d) ? 'var(--lime)' : 'var(--surface-2)', border: `2px solid ${jokers.has(d) ? 'var(--gold)' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'var(--gold)' }}
                >
                  {jokers.has(d) ? 'J' : ''}
                </div>
              ))}
            </div>
            <div className="row muted" style={{ gap: 16, fontSize: 13 }}>
              <span className="row" style={{ gap: 6 }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--lime)' }} />
                joué
              </span>
              <span className="row" style={{ gap: 6 }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, border: '2px solid var(--gold)' }} />
                joker (J)
              </span>
              <span className="row" style={{ gap: 6 }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--surface-2)' }} />
                pause
              </span>
            </div>
          </section>

          <section className="panel">
            <h2>Derniers mots acquis</h2>
            {dash.lastAcquired.length === 0 ? (
              <p className="muted">Les premiers mots arrivent en « Acquis » après 6 bonnes réponses espacées.</p>
            ) : (
              <div className="row wrap" style={{ gap: 8 }}>
                {dash.lastAcquired.map((wid, k) => (
                  <span key={wid} className="pop" style={{ minHeight: 40, padding: '0 14px', borderRadius: 20, background: k === 0 ? 'var(--lime)' : 'var(--surface-2)', color: k === 0 ? 'var(--ink)' : undefined, display: 'flex', alignItems: 'center', fontSize: 17, fontWeight: 700, animationDelay: `${0.3 + k * 0.07}s` }}>
                    {wordName(wid)}
                  </span>
                ))}
              </div>
            )}
          </section>

          {view === 'parents' && (
            <>
              <section className="panel rise">
                <h2>Réussite par famille de modes</h2>
                {(['reconnaissance', 'rappel', 'production'] as const).map((f) => {
                  const rate = successRate(f)
                  return (
                    <div key={f} className="row" style={{ justifyContent: 'space-between', fontSize: 17 }}>
                      <span style={{ textTransform: 'capitalize' }}>{f}</span>
                      <strong>{rate === undefined ? '—' : `${rate} %`}</strong>
                    </div>
                  )
                })}
              </section>
              <section className="panel rise">
                <h2>Mots coriaces</h2>
                {dash.hardWords.length === 0 ? (
                  <p className="muted">Aucun mot raté 3 fois ou plus.</p>
                ) : (
                  <>
                    <p className="muted" style={{ fontSize: 15 }}>
                      À retravailler hors du jeu : réexpliquer, changer la phrase ou la définition.
                    </p>
                    {dash.hardWords.map((p) => (
                      <Link key={p.wordId} to={`/parents/mots/${p.wordId}`} className="row" style={{ justifyContent: 'space-between', minHeight: 48, padding: '0 16px', borderRadius: 16, background: 'var(--surface-2)', color: 'var(--text)', textDecoration: 'none' }}>
                        <span style={{ fontSize: 18, fontWeight: 700 }}>{wordName(p.wordId)}</span>
                        <span className="muted" style={{ fontSize: 14 }}>
                          raté {p.misses} fois · modifier
                        </span>
                      </Link>
                    ))}
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

function Tile({ label, children, highlight = false, border }: { label: string; children: React.ReactNode; highlight?: boolean; border?: string }) {
  return (
    <div
      className="rise"
      style={{ minHeight: 116, borderRadius: 26, background: highlight ? 'var(--lime)' : 'var(--surface)', color: highlight ? 'var(--ink)' : undefined, border: highlight ? 'none' : `2px solid ${border ?? 'var(--line)'}`, padding: '18px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8 }}
    >
      <span style={{ fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: highlight ? undefined : 'var(--text-muted)' }}>{label}</span>
      {children}
    </div>
  )
}

const shortDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

function WeeklyChart({ points }: { points: { week: string; total: number }[] }) {
  const w = 560
  const h = 170
  const pad = { l: 34, r: 12, t: 16, b: 28 }
  const max = Math.max(5, ...points.map((p) => p.total))
  const x = (i: number) => pad.l + (i * (w - pad.l - pad.r)) / Math.max(1, points.length - 1)
  const y = (v: number) => pad.t + (1 - v / max) * (h - pad.t - pad.b)
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.total)}`).join(' ')
  const label = (week: string) => {
    const [yy, mm, dd] = week.split('-').map(Number)
    return shortDate.format(new Date(yy, mm - 1, dd))
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Mots acquis par semaine : ${points.map((p) => p.total).join(', ')}`} style={{ width: '100%', height: 'auto' }}>
      {[0, max / 2, max].map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={1} />
          <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize={12} fill="var(--text-muted)">
            {Math.round(v)}
          </text>
        </g>
      ))}
      <path d={line} fill="none" stroke="var(--lime)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={p.week}>
          <circle cx={x(i)} cy={y(p.total)} r={i === points.length - 1 ? 6 : 4} fill="var(--lime)" />
          {(i === 0 || i === points.length - 1 || i % 2 === 0) && (
            <text x={x(i)} y={h - 8} textAnchor="middle" fontSize={12} fill="var(--text-muted)">
              {label(p.week)}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
