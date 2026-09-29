// Réglages : taille des parties, barème des points, code parents.

import { useState } from 'react'
import { saveSettings } from '../../data/repo'
import { DEFAULT_SCORES, type ScoreTable } from '../../domain/scoring'
import type { AgeGroup } from '../../domain/types'
import { useSettings } from '../common'
import { unlockParents } from './Parents'

const AGES: [AgeGroup, string][] = [
  ['12-14', '12–14 ans'],
  ['15-18', '15–18 ans'],
  ['adulte', 'Adulte'],
]
const ROWS: [keyof ScoreTable['adulte'], string][] = [
  ['reconnaissance', 'Reconnaissance réussie'],
  ['rappel', 'Rappel réussi'],
  ['production', 'Production réussie'],
  ['presque', 'Presque'],
  ['monteeDeBoite', 'Mot « monté de boîte »'],
]

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="row" style={{ gap: 12 }}>
      <button className="btn btn-sm btn-icon" style={{ width: 48 }} aria-label={`${label} : moins`} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
        −
      </button>
      <span className="disp" style={{ minWidth: 40, textAlign: 'center', fontSize: 22, fontWeight: 700 }} aria-live="polite">
        {value}
      </span>
      <button className="btn btn-sm btn-icon" style={{ width: 48 }} aria-label={`${label} : plus`} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
        +
      </button>
    </div>
  )
}

export function SettingsPanel() {
  const settings = useSettings()
  const [pin, setPin] = useState('')
  const [pinMessage, setPinMessage] = useState<string>()

  const setScore = (age: AgeGroup, row: keyof ScoreTable['adulte'], value: number) =>
    saveSettings({ scores: { ...settings.scores, [age]: { ...settings.scores[age], [row]: value } } })

  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <section className="panel">
        <h2>Parties</h2>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>Cartes par partie (au plus)</span>
          <Stepper label="Cartes par partie" value={settings.maxCards} min={5} max={30} onChange={(v) => saveSettings({ maxCards: v })} />
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>Mots nouveaux par partie</span>
          <Stepper label="Mots nouveaux" value={settings.maxNew} min={0} max={5} onChange={(v) => saveSettings({ maxNew: v })} />
        </div>
        <p className="muted" style={{ fontSize: 15 }}>
          Pas de mot nouveau quand 15 mots ou plus sont à réviser : on consolide d’abord.
        </p>

        <h2 style={{ marginTop: 12 }}>Son</h2>
        {(
          [
            ['sound', 'Effets sonores', 'boutons, bonnes réponses, mots qui montent, fin de partie'],
            ['music', 'Musique de fond', 'calme dans les menus, plus rythmée pendant la partie'],
          ] as const
        ).map(([key, label, hint]) => (
          <label key={key} className="row" style={{ gap: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={settings[key]} onChange={(e) => saveSettings({ [key]: e.target.checked })} style={{ width: 28, height: 28, accentColor: 'var(--lime)' }} />
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 18, fontWeight: 600 }}>{label}</span>
              <span className="muted" style={{ fontSize: 14 }}>
                {hint}
              </span>
            </span>
          </label>
        ))}

        <h2 style={{ marginTop: 12 }}>Code parents</h2>
        <p className="muted" style={{ fontSize: 15 }}>
          {settings.parentPin ? 'Un code protège l’Espace parents.' : 'Aucun code : tout le monde peut ouvrir l’Espace parents.'}
        </p>
        <div className="row wrap">
          <input
            className="input input-sm"
            style={{ width: 160 }}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="4 chiffres"
            aria-label="Nouveau code"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          />
          <button
            className="btn btn-sm"
            disabled={pin.length < 4}
            onClick={async () => {
              unlockParents()
              await saveSettings({ parentPin: pin })
              setPin('')
              setPinMessage('Code enregistré.')
            }}
          >
            Définir le code
          </button>
          {settings.parentPin && (
            <button
              className="btn btn-sm btn-outline"
              onClick={async () => {
                await saveSettings({ parentPin: '' })
                setPinMessage('Code retiré.')
              }}
            >
              Retirer le code
            </button>
          )}
        </div>
        {pinMessage && <p role="status">{pinMessage}</p>}
      </section>

      <section className="panel">
        <h2>Barème des points</h2>
        <p className="muted" style={{ fontSize: 15 }}>
          Points équilibrés selon l’âge : les adultes gagnent moins, pour que le plus jeune ait de vraies chances de gagner. +5 points par jour joué, pour tout le monde.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 16 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8 }}>Résultat</th>
                {AGES.map(([a, l]) => (
                  <th key={a} style={{ padding: 8 }}>
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([row, label]) => (
                <tr key={row} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: 8, fontWeight: 600 }}>{label}</td>
                  {AGES.map(([a]) => (
                    <td key={a} style={{ padding: 6, textAlign: 'center' }}>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={10}
                        className="input input-sm"
                        style={{ width: 72, textAlign: 'center', padding: '6px 8px' }}
                        aria-label={`${label}, ${a}`}
                        value={settings.scores[a][row]}
                        onChange={(e) => setScore(a, row, Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn btn-sm btn-outline" style={{ alignSelf: 'flex-start' }} onClick={() => saveSettings({ scores: DEFAULT_SCORES })}>
          Revenir au barème par défaut
        </button>
      </section>
    </div>
  )
}
