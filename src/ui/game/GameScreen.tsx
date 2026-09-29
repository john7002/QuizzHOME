import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadCurrentGame, recordCard, saveCurrentGame } from '../../data/repo'
import { toDay } from '../../domain/days'
import { answerCard, currentCard, pointsByPlayer, startRounds, type Game } from '../../domain/game'
import { MODES } from '../../domain/modes'
import { pointsFor } from '../../domain/scoring'
import type { Result } from '../../domain/types'
import { Avatar, Loading, useData } from '../common'
import { IconCheck, IconPause, IconRetry, IconStar, IconWave } from '../icons'
import { play } from '../audio'
import { useTrack } from '../useTrack'
import { CardView } from './CardView'
import { Discovery } from './Discovery'
import { EndScreen } from './EndScreen'

const FAMILY_LABEL = { reconnaissance: 'Échauffement', rappel: 'Rappel', production: 'Production' }
const POP_COLORS = ['#C8F55A', '#FFC53D', '#5AD8FF', '#FF7A59', '#9B7BFF']

interface Pop {
  text: string
  color: string
  boxUp?: string
}

export function GameScreen() {
  const data = useData()
  const navigate = useNavigate()
  const [game, setGame] = useState<Game | null>()
  const [revealed, setRevealed] = useState(false)
  const [pop, setPop] = useState<Pop>()
  const busy = useRef(false)
  useTrack(game?.phase === 'end' ? 'aucune' : 'partie')

  useEffect(() => {
    loadCurrentGame().then((g) => setGame(g ?? null))
  }, [])

  if (game === null) {
    return (
      <main className="screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <p className="disp" style={{ fontSize: 28 }}>
          Aucune partie en cours.
        </p>
        <Link to="/" className="btn btn-primary">
          Retour à l’accueil
        </Link>
      </main>
    )
  }
  if (!game || !data) return <Loading />

  const players = game.playerIds.map((id) => data.players.find((p) => p.id === id)).filter((p) => p !== undefined)
  const wordsById = new Map(data.words.map((w) => [w.id, w]))

  if (game.phase === 'discovery') {
    return (
      <Discovery
        words={game.discovery.map((id) => wordsById.get(id)).filter((w) => w !== undefined)}
        onDone={async () => {
          const next = startRounds(game)
          play('manche')
          await saveCurrentGame(next)
          setGame(next)
        }}
      />
    )
  }

  if (game.phase === 'end') {
    return <EndScreen game={game} data={data} onReplay={() => navigate('/')} />
  }

  const card = currentCard(game)
  const word = card && wordsById.get(card.wordId)
  const player = card && players.find((p) => p.id === card.playerId)

  // Mot ou joueur supprimé pendant la partie : on passe la carte.
  if (!card || !word || !player) {
    const skipped = { ...game, cardIndex: game.cardIndex + 1 }
    const round = game.rounds[game.roundIndex]
    const next: Game =
      skipped.cardIndex < round.cards.length
        ? skipped
        : game.roundIndex + 1 < game.rounds.length
          ? { ...game, roundIndex: game.roundIndex + 1, cardIndex: 0 }
          : { ...game, phase: 'end' }
    queueMicrotask(() => setGame(next))
    return <Loading />
  }

  const progress = data.progress.find((p) => p.playerId === player.id && p.wordId === word.id)
  const box = progress?.box ?? 0
  const family = MODES[card.mode].family
  const round = game.rounds[game.roundIndex]
  const scores = pointsByPlayer(game)
  const willRise = box !== 6 && !(family === 'reconnaissance' && box >= 2)
  const gainWin = card.retry ? 0 : pointsFor(player.ageGroup, family, 'reussi', willRise, data.settings.scores)
  const gainAlmost = card.retry ? 0 : pointsFor(player.ageGroup, family, 'presque', false, data.settings.scores)

  async function rate(result: Result) {
    if (busy.current || !game || !card || !player) return
    busy.current = true
    const effect = answerCard(game, result, { player, progress, scores: data!.settings.scores, today: toDay() })
    await recordCard(effect)
    const up = effect.progress && effect.progress.box > (progress?.box ?? 1)
    play(result)
    if (effect.progress?.box === 6 && up) setTimeout(() => play('acquis'), 350)
    else if (up) setTimeout(() => play('monte'), 350)
    const points = effect.review?.points ?? 0
    setPop({
      text: result === 'rate' ? 'À revoir' : points > 0 ? `+${points}` : 'Bien joué',
      color: result === 'rate' ? '#F7F4FF' : result === 'presque' ? '#FFC53D' : '#C8F55A',
      boxUp: up ? `Boîte ${progress?.box ?? 1} → ${effect.progress!.box === 6 ? 'Acquis' : effect.progress!.box}` : undefined,
    })
    setTimeout(() => {
      setPop(undefined)
      setRevealed(false)
      setGame(effect.game)
      if (effect.game.phase === 'play' && effect.game.roundIndex !== game.roundIndex) play('manche')
      busy.current = false
    }, 1100)
  }

  return (
    <main className="screen" style={{ gap: 18 }}>
      <header className="row" style={{ justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <Link to="/" className="btn">
          <IconPause /> Pause
        </Link>
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div className="eyebrow" style={{ textAlign: 'center' }}>
            <span style={{ color: 'var(--gold)' }}>
              Manche {game.roundIndex + 1} / {game.rounds.length} · {FAMILY_LABEL[round.family]}
            </span>{' '}
            — {MODES[card.mode].name}
          </div>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap', justifyContent: 'center' }} aria-label={`Carte ${game.cardIndex + 1} sur ${round.cards.length}`}>
            {round.cards.map((c, k) => (
              <div
                key={c.id}
                style={{
                  width: k === game.cardIndex ? 34 : 18,
                  height: 10,
                  borderRadius: 5,
                  background: k < game.cardIndex ? 'var(--lime)' : k === game.cardIndex ? 'var(--gold)' : 'var(--line)',
                  transition: 'all .3s',
                }}
              />
            ))}
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {players.map((p) => (
            <div
              key={p.id}
              className="row"
              aria-label={`${p.name} : ${scores.get(p.id) ?? 0} points`}
              style={{ height: 60, padding: '0 12px 0 6px', borderRadius: 20, background: p.id === player.id ? 'var(--line)' : 'var(--surface)', border: `2px solid ${p.color}`, gap: 8 }}
            >
              <Avatar player={p} size={40} />
              <span className="disp" style={{ fontSize: 20, fontWeight: 700 }}>
                {scores.get(p.id) ?? 0}
              </span>
            </div>
          ))}
        </div>
      </header>

      <div className="row wrap rise" key={`turn-${card.id}`} style={{ gap: 16 }}>
        <div className="bob">
          <Avatar player={player} size={60} rotate={-6} />
        </div>
        <div className="disp" style={{ fontSize: 'clamp(28px, 3.4vw, 38px)', fontWeight: 800, letterSpacing: -0.5 }}>
          À toi, <span style={{ color: player.color }}>{player.name}</span> !
        </div>
        <div className="pill muted" style={{ marginLeft: 'auto', fontSize: 16 }}>
          {MODES[card.mode].hint}
        </div>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '8px 14px 14px 0' }}>
        <CardView
          key={card.id}
          card={card}
          word={word}
          words={data.words}
          box={box}
          playerName={player.name}
          revealed={revealed}
          onReveal={() => {
            if (!revealed) play('retourne')
            setRevealed(true)
          }}
          accent={player.color}
        />
        {pop && <PopOverlay pop={pop} />}
      </div>

      <div className="rate-grid">
        <button className="rate-btn" onClick={() => rate('reussi')} style={{ background: 'var(--lime)', boxShadow: '0 7px 0 var(--lime-deep)' }}>
          <IconCheck />
          <span>
            <span className="t">Réussi</span>
            <span className="s">{card.retry ? 'deuxième essai' : `+${gainWin} pts${willRise ? ' · monte' : ''}`}</span>
          </span>
        </button>
        <button className="rate-btn" onClick={() => rate('presque')} style={{ background: 'var(--gold)', boxShadow: '0 7px 0 var(--gold-deep)' }}>
          <IconWave />
          <span>
            <span className="t">Presque</span>
            <span className="s">{card.retry ? 'deuxième essai' : `+${gainAlmost} pt · même boîte`}</span>
          </span>
        </button>
        <button className="rate-btn" onClick={() => rate('rate')} style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '3px solid var(--line-2)', boxShadow: '0 7px 0 #0B0920' }}>
          <IconRetry />
          <span>
            <span className="t">À revoir</span>
            <span className="s muted" style={{ fontWeight: 600 }}>
              {card.retry ? 'on le reverra bientôt' : 'revient en fin de manche'}
            </span>
          </span>
        </button>
      </div>
    </main>
  )
}

function PopOverlay({ pop }: { pop: Pop }) {
  return (
    <div role="status" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ position: 'relative', width: 10, height: 10 }}>
        {Array.from({ length: 10 }, (_, k) => (
          <span
            key={k}
            className="burst"
            style={{ position: 'absolute', left: -12, top: -12, color: POP_COLORS[k % 5], animationDelay: `${(k % 3) * 0.05}s`, ['--r' as string]: `${k * 36}deg` }}
          >
            <IconStar size={34} />
          </span>
        ))}
      </div>
      <div className="popscore" style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <span
          className="disp"
          style={{ fontSize: 'clamp(64px, 9vw, 120px)', fontWeight: 800, color: pop.color, WebkitTextStroke: '4px #120F2A', paintOrder: 'stroke fill', textShadow: '0 8px 0 #120F2A' }}
        >
          {pop.text}
        </span>
        {pop.boxUp && (
          <span className="disp" style={{ minHeight: 48, padding: '0 22px', borderRadius: 24, background: 'var(--ink)', color: 'var(--lime)', border: '3px solid var(--lime)', display: 'flex', alignItems: 'center', fontSize: 20, fontWeight: 700 }}>
            {pop.boxUp} ↑
          </span>
        )}
      </div>
    </div>
  )
}
