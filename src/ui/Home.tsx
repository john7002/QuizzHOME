import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getLastModes, loadCurrentGame, saveCurrentGame, saveSettings, setLastModes } from '../data/repo'
import { toDay } from '../domain/days'
import { cardCount, createGame } from '../domain/game'
import { MODES, MODES_BY_FAMILY, ROUND_FAMILIES, shuffle } from '../domain/modes'
import { dashboard, nextMilestone, streak } from '../domain/stats'
import type { ModeId } from '../domain/types'
import { Avatar, Loading, ROT, useData } from './common'
import { IconBars, IconFlame, IconLock, IconPlay, IconPlus, IconSoundOff, IconSoundOn, IconStar, IconArrow, IconCheck, Trophy } from './icons'
import { useBackupStatus } from './useBackupStatus'

const ROUND_COLORS = ['var(--cyan)', 'var(--gold)', 'var(--coral)']
const ROUND_ROLES = ['Échauffement', 'Rappel', 'Production']

const dayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

/** Propose des modes différents de la dernière partie, pour éviter la routine. */
function pickModes(last: ModeId[] | undefined): ModeId[] {
  return ROUND_FAMILIES.map((family, i) => {
    const options = MODES_BY_FAMILY[family]
    const fresh = options.filter((m) => m !== last?.[i])
    return shuffle(fresh.length ? fresh : options, Math.random)[0]
  })
}

export function Home() {
  const data = useData()
  const navigate = useNavigate()
  const backup = useBackupStatus()
  const current = useLiveQuery(loadCurrentGame)
  const lastModes = useLiveQuery(getLastModes, [], null)
  const [modes, setModes] = useState<ModeId[]>()
  const [absent, setAbsent] = useState<Set<string>>(new Set())
  const today = toDay()

  useEffect(() => {
    if (lastModes !== null && !modes) setModes(pickModes(lastModes))
  }, [lastModes, modes])

  const present = useMemo(() => data?.players.filter((p) => !absent.has(p.id)) ?? [], [data, absent])
  const main = data?.players.find((p) => p.isMainLearner) ?? data?.players[0]

  const preview = useMemo(() => {
    if (!data || !modes || present.length === 0) return undefined
    return createGame({
      players: present,
      words: data.words,
      progress: data.progress,
      today,
      maxCards: data.settings.maxCards,
      maxNew: data.settings.maxNew,
      modes: modes as [ModeId, ModeId, ModeId],
      rng: () => 0.5,
      newId: () => '',
    })
  }, [data, modes, present, today])

  if (!data || !modes) return <Loading />

  const cards = preview ? cardCount(preview) : 0
  const fresh = preview?.discovery.length ?? 0
  const toReview = cards - fresh
  const drafts = data.words.filter((w) => w.status === 'brouillon').length
  const mainStreak = main ? streak(data.reviews.filter((r) => r.playerId === main.id).map((r) => r.day), today) : undefined
  const mainDash = main ? dashboard(data.progress, data.reviews, main.id, today) : undefined
  const milestone = mainDash ? nextMilestone(mainDash.acquired) : undefined
  const noPlayers = data.players.length === 0

  async function play() {
    if (!data || !modes || present.length === 0) return
    const game = createGame({
      players: present,
      words: data.words,
      progress: data.progress,
      today,
      maxCards: data.settings.maxCards,
      maxNew: data.settings.maxNew,
      modes: modes as [ModeId, ModeId, ModeId],
    })
    await saveCurrentGame(game)
    await setLastModes(modes)
    navigate('/partie')
  }

  function cycleMode(i: number) {
    const options = MODES_BY_FAMILY[ROUND_FAMILIES[i]]
    const next = options[(options.indexOf(modes![i]) + 1) % options.length]
    setModes(modes!.map((m, k) => (k === i ? next : m)))
  }

  const togglePlayer = (id: string) =>
    setAbsent((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <main className="screen">
      <header className="topbar">
        <div className="disp row" style={{ fontSize: 26, fontWeight: 800, gap: 14 }}>
          <div className="avatar" style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--lime)', fontSize: 24, transform: 'rotate(-8deg)' }}>
            Q
          </div>
          <span>
            QUIZZ<span style={{ color: 'var(--lime)' }}>HOME</span>
          </span>
        </div>
        <div className="spacer" />
        {mainStreak && mainStreak.days > 0 && (
          <div className="row" style={{ height: 56, padding: '0 20px 0 14px', borderRadius: 28, background: 'var(--surface-2)', border: '2px solid var(--coral)', gap: 10 }}>
            <IconFlame className="flicker" />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
              <span className="disp" style={{ fontSize: 20, fontWeight: 700 }}>
                {mainStreak.days} jour{mainStreak.days > 1 ? 's' : ''}
              </span>
              <span className="muted" style={{ fontSize: 13 }}>
                de série{mainStreak.jokerAvailable ? ' · 1 joker dispo' : ''}
              </span>
            </div>
          </div>
        )}
        <button
          className="btn btn-icon"
          aria-label={data.settings.sound ? 'Couper le son' : 'Activer le son'}
          aria-pressed={data.settings.sound}
          onClick={() => saveSettings({ sound: !data.settings.sound })}
          style={{ color: data.settings.sound ? 'var(--lime)' : 'var(--text-muted)' }}
        >
          {data.settings.sound ? <IconSoundOn /> : <IconSoundOff />}
        </button>
        <Link to="/parents" className="btn">
          <IconLock />
          Espace parents
        </Link>
      </header>

      {backup.due && data.reviews.length > 0 && (
        <div className="banner" role="status">
          <span>{backup.last ? 'Dernière sauvegarde il y a plus de 7 jours.' : 'Pense à faire une première sauvegarde.'}</span>
          <Link to="/parents/sauvegarde" className="btn btn-sm" style={{ background: 'var(--gold)', color: 'var(--ink)' }}>
            Sauvegarder
          </Link>
        </div>
      )}

      {noPlayers ? (
        <section className="panel rise" style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 20 }}>
          <h1 className="disp" style={{ fontSize: 40, fontWeight: 800 }}>
            Bienvenue !
          </h1>
          <p className="muted" style={{ fontSize: 20, maxWidth: 560 }}>
            Commence par créer les joueurs de la famille, puis ajoute des mots ou active un paquet de départ.
          </p>
          <Link to="/parents/joueurs/nouveau?accueil" className="btn btn-primary" style={{ minHeight: 76, fontSize: 22 }}>
            <IconPlus /> Créer les joueurs
          </Link>
        </section>
      ) : (
        <div className="grid-2" style={{ flexGrow: 1, ['--cols' as string]: '1.4fr 1fr' }}>
          <section className="panel rise" style={{ gap: 20, padding: 32, position: 'relative', overflow: 'hidden' }}>
            <div className="eyebrow">{dayFormat.format(new Date())} · Partie du jour</div>
            {cards > 0 ? (
              <h1 className="disp" style={{ fontSize: 'clamp(32px, 4vw, 46px)', lineHeight: 1.1, fontWeight: 800, letterSpacing: -1 }}>
                Ce soir, <span style={{ color: 'var(--lime)' }}>{cards} mot{cards > 1 ? 's' : ''}</span> à dompter.
              </h1>
            ) : (
              <h1 className="disp" style={{ fontSize: 'clamp(28px, 3.4vw, 40px)', lineHeight: 1.15, fontWeight: 800 }}>
                {data.words.some((w) => w.status === 'actif') ? 'Tout est révisé pour aujourd’hui !' : 'Aucun mot à jouer pour l’instant.'}
              </h1>
            )}
            {cards > 0 ? (
              <div className="row wrap">
                {toReview > 0 && <div className="pill">{toReview} à réviser</div>}
                {fresh > 0 && (
                  <div className="pill" style={{ background: 'var(--lime)', color: 'var(--ink)', fontWeight: 700 }}>
                    <IconStar /> {fresh} nouveau{fresh > 1 ? 'x' : ''}
                  </div>
                )}
                <div className="pill">≈ {Math.max(2, Math.round(cards * 0.75 + fresh * 0.4))} min</div>
              </div>
            ) : (
              <p className="muted" style={{ fontSize: 18 }}>
                Ajoute des mots de la semaine ou active un paquet de départ dans l’Espace parents.
              </p>
            )}
            {cards > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                {modes.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => cycleMode(i)}
                    aria-label={`Manche ${i + 1} : ${MODES[m].name}. Toucher pour changer de mode.`}
                    style={{ background: 'var(--surface-2)', border: 'none', borderRadius: 20, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left' }}
                  >
                    <span className="disp" style={{ fontSize: 14, color: ROUND_COLORS[i], fontWeight: 700 }}>
                      MANCHE {i + 1}
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>{MODES[m].name}</span>
                    <span className="muted" style={{ fontSize: 14 }}>
                      {ROUND_ROLES[i]}
                      {i === 2 ? ' · + de points' : ''} · changer
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="spacer" />
            {current && (
              <Link to="/partie" className="btn btn-gold disp" style={{ minHeight: 76, fontSize: 22 }}>
                Reprendre la partie en cours
              </Link>
            )}
            <button
              onClick={play}
              disabled={cards === 0 || present.length === 0}
              className="btn btn-primary disp pulse"
              style={{ minHeight: 104, borderRadius: 30, fontSize: 36, fontWeight: 800, letterSpacing: 1, gap: 18 }}
            >
              <IconPlay /> {current ? 'NOUVELLE PARTIE' : 'JOUER'}
            </button>
          </section>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            <section className="panel rise" style={{ animationDelay: '.1s' }}>
              <h2>Qui joue ce soir ?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                {data.players.map((p, k) => {
                  const on = !absent.has(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlayer(p.id)}
                      aria-pressed={on}
                      style={{
                        position: 'relative',
                        minHeight: 84,
                        borderRadius: 22,
                        background: 'var(--surface-2)',
                        border: `3px solid ${on ? p.color : 'transparent'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '0 14px',
                        textAlign: 'left',
                        opacity: on ? 1 : 0.6,
                      }}
                    >
                      <Avatar player={p} rotate={ROT[k % ROT.length]} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                        <span style={{ fontSize: 19, fontWeight: 700 }}>{p.name}</span>
                        <span className="muted" style={{ fontSize: 13 }}>
                          {p.isMainLearner ? 'Apprenant principal' : p.ageGroup === 'adulte' ? 'Adulte' : `${p.ageGroup} ans`}
                        </span>
                      </div>
                      {on && (
                        <div
                          className="avatar"
                          style={{ position: 'absolute', right: -8, top: -8, width: 28, height: 28, borderRadius: '50%', background: p.color, border: '3px solid var(--surface)' }}
                        >
                          <IconCheck size={14} width={4} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>

            {main && mainDash && (
              <Link
                to="/classement"
                className="panel rise"
                style={{ flexGrow: 1, textDecoration: 'none', color: 'var(--text)', background: 'var(--surface-2)', borderColor: 'var(--gold)', animationDelay: '.2s' }}
              >
                <div className="row" style={{ gap: 18 }}>
                  <div className="float" style={{ width: 88, height: 88, flexShrink: 0, borderRadius: 26, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trophy />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span className="eyebrow" style={{ color: 'var(--gold)', fontSize: 14 }}>
                      {milestone ? 'Prochaine coupe' : 'Toutes les coupes gagnées'}
                    </span>
                    <span className="disp" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.15 }}>
                      {milestone ? `Coupe des ${milestone} mots` : 'Champion des mots'}
                    </span>
                    {milestone && (
                      <span className="muted" style={{ fontSize: 16 }}>
                        {main.name} · encore {milestone - mainDash.acquired} mot{milestone - mainDash.acquired > 1 ? 's' : ''} acquis
                      </span>
                    )}
                  </div>
                </div>
                {milestone && (
                  <div style={{ height: 22, borderRadius: 11, background: 'var(--ink)', overflow: 'hidden' }}>
                    <div className="grow shine" style={{ width: `${(mainDash.acquired / milestone) * 100}%`, height: '100%', borderRadius: 11, background: 'var(--gold)' }} />
                  </div>
                )}
                <div className="row" style={{ justifyContent: 'space-between', fontSize: 16, fontWeight: 600 }}>
                  <span>{milestone ? `${mainDash.acquired} / ${milestone}` : `${mainDash.acquired} mots acquis`}</span>
                  <span className="row" style={{ color: 'var(--gold)', gap: 6 }}>
                    Classement & trophées <IconArrow />
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {!noPlayers && (
        <footer className="row wrap" style={{ justifyContent: 'space-between' }}>
          {main && mainDash ? (
            <Link to={`/progres/${main.id}`} className="btn btn-outline" style={{ borderRadius: 30, background: 'var(--surface)' }}>
              <span style={{ color: 'var(--cyan)', display: 'flex' }}>
                <IconBars />
              </span>
              Progrès · {mainDash.acquired} mot{mainDash.acquired > 1 ? 's' : ''} acquis
            </Link>
          ) : (
            <span />
          )}
          <Link to="/ajouter" className="btn btn-coral" style={{ minHeight: 72, borderRadius: 36, fontSize: 20, position: 'relative', paddingRight: 30 }}>
            <IconPlus /> Ajouter un mot
            {drafts > 0 && (
              <span
                aria-label={`${drafts} mot${drafts > 1 ? 's' : ''} à compléter`}
                style={{ position: 'absolute', top: -10, right: -6, minWidth: 30, height: 30, borderRadius: 15, background: 'var(--text)', color: 'var(--ink)', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}
              >
                {drafts}
              </span>
            )}
          </Link>
        </footer>
      )}
    </main>
  )
}
