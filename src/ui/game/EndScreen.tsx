// Fin de partie : podium du jour, mots qui ont grimpé, mot à réutiliser pendant la soirée.

import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { saveCurrentGame } from '../../data/repo'
import { cardCount, pointsByPlayer, type Game } from '../../domain/game'
import { ACQUIS, type Player } from '../../domain/types'
import { Avatar, type AppData } from '../common'
import { play } from '../audio'
import { Crown, IconStar, IconTrend, Trophy } from '../icons'

const CONFETTI = ['#C8F55A', '#FFC53D', '#5AD8FF', '#FF7A59', '#9B7BFF']
const PLACE = [
  { color: '#FFC53D', base: '#120F2A', height: 215, avatar: 88 },
  { color: '#C9CEDB', base: '#9AA0B3', height: 150, avatar: 72 },
  { color: '#E0935C', base: '#A8663A', height: 110, avatar: 72 },
]

export function EndScreen({ game, data, onReplay }: { game: Game; data: AppData; onReplay: () => void }) {
  useEffect(() => {
    // La partie est entièrement enregistrée : on la retire de « partie en cours ».
    void saveCurrentGame(undefined)
    play('fin')
  }, [])

  const scores = pointsByPlayer(game)
  const ranking = game.playerIds
    .map((id) => data.players.find((p) => p.id === id))
    .filter((p): p is Player => !!p)
    .sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0))
  const winner = ranking[0]
  const wordName = (id: string) => data.words.find((w) => w.id === id)?.word ?? '—'

  const firstTries = game.outcomes.filter((o) => !o.retry)
  const climbed = firstTries.filter((o) => o.boxAfter > o.boxBefore).sort((a, b) => b.boxAfter - a.boxAfter)
  const toReview = firstTries.filter((o) => o.result === 'rate').length
  const minutes = Math.max(1, Math.round((Date.now() - game.startedAt) / 60000))

  // Mot à réutiliser pendant la soirée : de préférence un mot de l'apprenant principal qui a grimpé.
  const tonight = useMemo(() => {
    const main = data.players.find((p) => p.isMainLearner)
    const pool = climbed.filter((o) => o.playerId === main?.id)
    const pick = (pool.length ? pool : climbed.length ? climbed : firstTries)[0]
    return pick ? wordName(pick.wordId) : undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Podium dans l'ordre 2 · 1 · 3.
  const podium = [ranking[1], ranking[0], ranking[2]].map((p, i) => ({ p, place: [1, 0, 2][i] })).filter((x) => x.p)

  return (
    <main className="screen" style={{ position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        {Array.from({ length: 16 }, (_, k) => (
          <span
            key={k}
            className="conf"
            style={{ position: 'absolute', top: -30, left: `${4 + k * 6}%`, width: 12, height: 22, borderRadius: 3, background: CONFETTI[k % 5], animationDuration: `${4.6 + ((k * 7) % 30) / 10}s`, animationDelay: `${(k * 13) % 35 / 10}s` }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}>
        <div className="eyebrow" style={{ letterSpacing: 2 }}>
          Partie terminée · {cardCount(game)} cartes · {minutes} min
        </div>
        <h1 className="disp rise" style={{ fontSize: 'clamp(32px, 4.2vw, 50px)', fontWeight: 800, letterSpacing: -1, textAlign: 'center' }}>
          {winner ? (
            <>
              {winner.name} remporte <span style={{ color: 'var(--gold)' }}>la soirée</span> !
            </>
          ) : (
            'Bravo !'
          )}
        </h1>
        <div className="row" style={{ gap: 14, color: 'var(--gold)' }}>
          <IconStar size={56} className="pop" />
          <IconStar size={72} className="pop" style={{ animationDelay: '.25s', marginTop: -10 }} />
          <IconStar size={56} className="pop" style={{ animationDelay: '.5s' }} />
        </div>
      </div>

      <div className="grid-2" style={{ flexGrow: 1, ['--cols' as string]: '1.15fr 1fr', position: 'relative' }}>
        <section className="row" style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 14 }}>
          {podium.map(({ p, place }) => {
            const style = PLACE[place]
            return (
              <div key={p!.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: place === 0 ? 190 : 170 }}>
                {place === 0 && (
                  <span className="crown">
                    <Crown size={54} />
                  </span>
                )}
                <Avatar player={p!} size={style.avatar} rotate={place === 0 ? -6 : 5} />
                <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
                  <div style={{ fontSize: 21, fontWeight: 800 }}>{p!.name}</div>
                  <div className="disp" style={{ fontSize: 19, color: place === 0 ? 'var(--gold)' : 'var(--text-muted)' }}>
                    {scores.get(p!.id) ?? 0} pts
                  </div>
                </div>
                <div
                  className={`stepup ${place === 0 ? 'shine' : ''}`}
                  style={{
                    width: '100%',
                    height: style.height,
                    borderRadius: '24px 24px 8px 8px',
                    background: place === 0 ? 'var(--gold)' : 'var(--surface-2)',
                    border: place === 0 ? 'none' : `3px solid ${style.color}`,
                    color: place === 0 ? 'var(--ink)' : style.color,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingTop: 16,
                    gap: 6,
                    animationDelay: `${place * 0.15}s`,
                  }}
                >
                  <Trophy size={place === 0 ? 60 : 44} color={place === 0 ? '#120F2A' : style.color} base={style.base} />
                  <span className="disp" style={{ fontSize: place === 0 ? 40 : 28, fontWeight: 800 }}>
                    {place + 1}
                  </span>
                </div>
              </div>
            )
          })}
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="panel rise" style={{ animationDelay: '.4s' }}>
            <h2 className="row" style={{ gap: 10 }}>
              <span style={{ color: 'var(--lime)', display: 'flex' }}>
                <IconTrend />
              </span>
              {climbed.length === 0 ? 'Les mots vont grimper !' : `${climbed.length} mot${climbed.length > 1 ? 's ont' : ' a'} grimpé`}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {climbed.slice(0, 4).map((o) => {
                const acquis = o.boxAfter === ACQUIS
                return (
                  <div
                    key={o.cardId}
                    className="row"
                    style={{ justifyContent: 'space-between', minHeight: 48, padding: '0 16px', borderRadius: 16, background: acquis ? 'var(--lime)' : 'var(--surface-2)', color: acquis ? 'var(--ink)' : undefined }}
                  >
                    <span style={{ fontSize: 19, fontWeight: 700 }}>
                      {wordName(o.wordId)}
                      {game.playerIds.length > 1 && (
                        <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.7 }}> · {data.players.find((p) => p.id === o.playerId)?.name}</span>
                      )}
                    </span>
                    <span className="disp row" style={{ fontSize: 15, fontWeight: 700, color: acquis ? undefined : 'var(--lime)', gap: 6 }}>
                      {acquis ? (
                        <>
                          <IconStar size={16} /> ACQUIS !
                        </>
                      ) : (
                        `Boîte ${o.boxBefore} → ${o.boxAfter}`
                      )}
                    </span>
                  </div>
                )
              })}
              <div className="muted" style={{ fontSize: 15, paddingLeft: 4 }}>
                {[climbed.length > 4 && `+ ${climbed.length - 4} autre${climbed.length - 4 > 1 ? 's' : ''}`, toReview > 0 && `${toReview} mot${toReview > 1 ? 's' : ''} à revoir demain`]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </div>
          </section>
          {tonight && (
            <section className="panel rise" style={{ flexGrow: 1, background: 'var(--coral)', color: 'var(--ink)', border: 'none', animationDelay: '.6s', transform: 'rotate(1deg)', gap: 8 }}>
              <span className="eyebrow" style={{ color: 'var(--ink)', fontSize: 14, fontWeight: 800 }}>
                Mot à placer ce soir
              </span>
              <span className="disp" style={{ fontSize: 30, fontWeight: 800 }}>
                « {tonight} »
              </span>
              <span style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.35 }}>Essayez de le glisser naturellement dans la conversation avant le coucher.</span>
            </section>
          )}
        </div>
      </div>

      <footer className="row" style={{ justifyContent: 'center', gap: 16, position: 'relative' }}>
        <button className="btn btn-outline" style={{ minHeight: 76, borderRadius: 26, fontSize: 20 }} onClick={onReplay}>
          Encore une partie
        </button>
        <Link to="/" className="btn btn-primary disp" style={{ minHeight: 76, borderRadius: 26, fontSize: 22, padding: '0 44px' }}>
          Terminer
        </Link>
      </footer>
    </main>
  )
}
