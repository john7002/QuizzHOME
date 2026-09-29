// Espace parents : mots, joueurs, paquets de départ, réglages, sauvegarde.

import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { getSettings } from '../../data/repo'
import { BackLink } from '../common'

// Déverrouillé jusqu'au prochain lancement de l'application.
let unlocked = false

export function unlockParents() {
  unlocked = true
}

const TABS = [
  ['mots', 'Mots'],
  ['joueurs', 'Joueurs'],
  ['paquets', 'Paquets de départ'],
  ['reglages', 'Réglages'],
  ['sauvegarde', 'Sauvegarde'],
] as const

export function Parents() {
  const settings = useLiveQuery(getSettings)
  const [, rerender] = useState(0)

  // Rien n'est affiché avant de savoir si un code protège l'Espace parents.
  if (!settings) return null

  if (settings.parentPin && !unlocked) {
    return (
      <PinGate
        pin={settings.parentPin}
        onOk={() => {
          unlocked = true
          rerender((n) => n + 1)
        }}
      />
    )
  }

  return (
    <main className="screen">
      <header className="topbar">
        <BackLink />
        <h1>Espace parents</h1>
      </header>
      <nav className="seg" style={{ alignSelf: 'flex-start', maxWidth: '100%', overflowX: 'auto' }} aria-label="Sections">
        {TABS.map(([path, label]) => (
          <NavLink key={path} to={path} className="parent-tab" style={({ isActive }) => ({ minHeight: 52, padding: '0 16px', borderRadius: 16, display: 'flex', alignItems: 'center', textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap', color: isActive ? 'var(--ink)' : 'var(--text)', background: isActive ? 'var(--lime)' : 'transparent' })}>
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </main>
  )
}

function PinGate({ pin, onOk }: { pin: string; onOk: () => void }) {
  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(false)

  function press(d: string) {
    const next = (value + d).slice(0, pin.length)
    setValue(next)
    setWrong(false)
    if (next.length === pin.length) {
      if (next === pin) onOk()
      else {
        setWrong(true)
        setValue('')
      }
    }
  }

  return (
    <main className="screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <h1 className="disp" style={{ fontSize: 30, fontWeight: 800 }}>
        Code parents
      </h1>
      <div className={`row ${wrong ? 'shake' : ''}`} aria-live="polite" aria-label={wrong ? 'Code incorrect' : `${value.length} chiffres saisis`}>
        {Array.from({ length: pin.length }, (_, i) => (
          <span key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: i < value.length ? 'var(--lime)' : 'var(--line)' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 84px)', gap: 12 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((d, i) =>
          d === '' ? (
            <span key={i} />
          ) : (
            <button key={i} className="btn disp" style={{ minHeight: 84, fontSize: 28 }} aria-label={d === '⌫' ? 'Effacer' : d} onClick={() => (d === '⌫' ? setValue(value.slice(0, -1)) : press(d))}>
              {d}
            </button>
          ),
        )}
      </div>
      <Link to="/" className="btn btn-outline">
        Retour
      </Link>
    </main>
  )
}
