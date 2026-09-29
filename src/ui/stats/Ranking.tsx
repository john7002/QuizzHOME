// Trophées & classement familial.

import { useState } from 'react'
import { toDay } from '../../domain/days'
import { dashboard, MILESTONES, standings, streak, type Period } from '../../domain/stats'
import { Avatar, BackLink, Loading, useData } from '../common'
import { Crown, IconFlame, IconInfo, IconLock, Trophy } from '../icons'

const TABS: [Period, string][] = [
  ['semaine', 'Semaine'],
  ['mois', 'Mois'],
  ['total', 'Depuis le début'],
]
const RANK_COLORS = ['var(--gold)', 'var(--silver)', 'var(--bronze)', 'var(--text-muted)']

export function Ranking() {
  const data = useData()
  const [period, setPeriod] = useState<Period>('semaine')
  const [showRules, setShowRules] = useState(false)
  if (!data) return <Loading />

  const today = toDay()
  const rows = standings(data.reviews, data.players.map((p) => p.id), period, today)
  const main = data.players.find((p) => p.isMainLearner) ?? data.players[0]
  const dash = main && dashboard(data.progress, data.reviews, main.id, today)
  const mainStreak = main && streak(data.reviews.filter((r) => r.playerId === main.id).map((r) => r.day), today)

  const trophies = dash
    ? [
        ...MILESTONES.map((m) => ({ label: `Coupe des ${m} mots`, value: dash.acquired, goal: m, color: 'var(--gold)', kind: 'cup' as const })),
        ...[7, 30].map((d) => ({ label: `Série de ${d} jours`, value: mainStreak?.days ?? 0, goal: d, color: 'var(--coral)', kind: 'flame' as const })),
      ]
    : []
  const won = trophies.filter((t) => t.value >= t.goal).length
  const nextIndex = (kind: 'cup' | 'flame') => trophies.findIndex((t) => t.kind === kind && t.value < t.goal)

  return (
    <main className="screen">
      <header className="topbar">
        <BackLink />
        <h1>
          Trophées <span style={{ color: 'var(--gold)' }}>&amp;</span> classement
        </h1>
      </header>

      <div className="grid-2" style={{ flexGrow: 1, ['--cols' as string]: '1fr 1.25fr' }}>
        <section className="panel">
          <div className="seg" role="tablist" aria-label="Période" style={{ ['--seg-on' as string]: 'var(--gold)' }}>
            {TABS.map(([p, label]) => (
              <button key={p} role="tab" aria-selected={period === p} onClick={() => setPeriod(p)}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map((r, k) => {
              const p = data.players.find((x) => x.id === r.playerId)!
              const first = k === 0 && r.points > 0
              return (
                <div
                  key={r.playerId}
                  className="rise row"
                  style={{ minHeight: 84, borderRadius: 24, background: first ? 'var(--line)' : 'var(--surface-2)', border: `3px solid ${first ? 'var(--gold)' : 'transparent'}`, gap: 14, padding: '0 18px', animationDelay: `${k * 0.08}s` }}
                >
                  <span className="disp" style={{ width: 34, fontSize: 26, fontWeight: 800, color: RANK_COLORS[Math.min(k, 3)] }}>
                    {k + 1}
                  </span>
                  <div style={{ position: 'relative' }}>
                    <Avatar player={p} />
                    {first && (
                      <span className="crown" style={{ position: 'absolute', top: -18, left: -8 }} aria-label="Premier">
                        <Crown />
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
                    <span style={{ fontSize: 20, fontWeight: 700 }}>{p.name}</span>
                    <span className="muted" style={{ fontSize: 14 }}>
                      {r.games} partie{r.games > 1 ? 's' : ''} · {r.daysPlayed} jour{r.daysPlayed > 1 ? 's' : ''} joué{r.daysPlayed > 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="disp" style={{ fontSize: 24, fontWeight: 800 }}>
                    {r.points}
                  </span>
                  <span className="muted" style={{ fontSize: 14, fontWeight: 700 }}>
                    pts
                  </span>
                </div>
              )
            })}
          </div>
          <div className="spacer" />
          <div className="row" style={{ gap: 10, alignItems: 'flex-start', fontSize: 15, lineHeight: 1.4 }}>
            <span style={{ color: 'var(--cyan)', display: 'flex', flexShrink: 0 }}>
              <IconInfo />
            </span>
            <span className="muted">
              Points équilibrés selon l’âge : les adultes gagnent moins de points par carte. +5 points par jour joué.{' '}
              <button onClick={() => setShowRules(!showRules)} style={{ background: 'none', border: 'none', color: 'var(--lime)', padding: 0, fontWeight: 700, textDecoration: 'underline' }}>
                Comment sont calculés les points ?
              </button>
            </span>
          </div>
          {showRules && (
            <div className="rise" style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 15 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 6 }}>Carte</th>
                    <th style={{ padding: 6 }}>12–14 ans</th>
                    <th style={{ padding: 6 }}>15–18 ans</th>
                    <th style={{ padding: 6 }}>Adulte</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ['reconnaissance', 'Reconnaissance réussie'],
                      ['rappel', 'Rappel réussi'],
                      ['production', 'Production réussie'],
                      ['presque', 'Presque'],
                      ['monteeDeBoite', 'Mot monté de boîte'],
                    ] as const
                  ).map(([key, label]) => (
                    <tr key={key} style={{ borderTop: '1px solid var(--line)' }}>
                      <td style={{ padding: 6 }}>{label}</td>
                      {(['12-14', '15-18', 'adulte'] as const).map((a) => (
                        <td key={a} style={{ padding: 6, textAlign: 'center' }}>
                          {key === 'monteeDeBoite' ? '+' : ''}
                          {data.settings.scores[a][key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {main && dash && (
          <section className="panel">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 style={{ fontSize: 22 }}>La vitrine de {main.name}</h2>
              <span className="muted" style={{ fontSize: 16, fontWeight: 600 }}>
                {won} / {trophies.length} trophées
              </span>
            </div>
            <div style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              {trophies.map((t, i) => {
                const done = t.value >= t.goal
                const next = i === nextIndex(t.kind)
                return (
                  <div
                    key={t.label}
                    className={done ? 'shine' : ''}
                    style={{
                      minHeight: 140,
                      borderRadius: 24,
                      background: done || next ? 'var(--surface-2)' : 'var(--ink-2)',
                      border: `2px ${next ? 'dashed' : 'solid'} ${done || next ? t.color : 'var(--surface-2)'}`,
                      color: done || next ? 'var(--text)' : 'var(--text-faint)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '10px 16px',
                      textAlign: 'center',
                    }}
                  >
                    {done ? (
                      <span className="float">{t.kind === 'cup' ? <Trophy size={54} /> : <IconFlame size={50} />}</span>
                    ) : next ? (
                      t.kind === 'cup' ? <Trophy size={50} outline /> : <IconFlame size={44} />
                    ) : (
                      <IconLock size={40} />
                    )}
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{t.label}</span>
                    {next && (
                      <>
                        <div style={{ width: '100%', height: 10, borderRadius: 5, background: 'var(--ink)', overflow: 'hidden' }}>
                          <div className="grow" style={{ width: `${(t.value / t.goal) * 100}%`, height: '100%', background: t.color, borderRadius: 5 }} />
                        </div>
                        <span className="muted" style={{ fontSize: 13 }}>
                          {t.value} / {t.goal}
                        </span>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
