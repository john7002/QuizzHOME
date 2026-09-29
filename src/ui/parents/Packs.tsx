// Paquets de départ : à activer par petits paquets quand la liste perso s'épuise.

import { useState } from 'react'
import { STARTER_PACKS } from '../../data/packs'
import { activatePack, setPackSuspended } from '../../data/repo'
import { useData } from '../common'

export function Packs() {
  const data = useData()
  const [message, setMessage] = useState<string>()
  if (!data) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p className="muted" style={{ fontSize: 17, maxWidth: 760 }}>
        Des mots courants du collège et du lycée, classés par thème. Active un paquet à la fois : ses mots entreront en partie petit à petit, au rythme des mots nouveaux.
      </p>
      {message && (
        <p role="status" style={{ fontWeight: 700, color: 'var(--lime)' }}>
          {message}
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {STARTER_PACKS.map((pack) => {
          const mine = data.words.filter((w) => w.packId === pack.id)
          const active = mine.length > 0
          const suspended = active && mine.every((w) => w.status === 'suspendu')
          return (
            <section key={pack.id} className="panel" style={{ gap: 10, borderColor: active && !suspended ? 'var(--lime)' : undefined }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h2 style={{ fontSize: 19 }}>{pack.title}</h2>
                <span className="pill" style={{ minHeight: 30, fontSize: 14, padding: '0 12px' }}>
                  {pack.level}
                </span>
              </div>
              <p className="muted" style={{ fontSize: 15 }}>
                {pack.words
                  .slice(0, 5)
                  .map((w) => w.word)
                  .join(', ')}
                …
              </p>
              <div className="spacer" />
              {!active ? (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={async () => {
                    const n = await activatePack(pack)
                    setMessage(n > 0 ? `« ${pack.title} » activé : ${n} mots ajoutés.` : `Tous les mots de « ${pack.title} » sont déjà dans le paquet.`)
                  }}
                >
                  Activer · {pack.words.length} mots
                </button>
              ) : (
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: suspended ? 'var(--text-faint)' : 'var(--lime)' }}>
                    {suspended ? 'Suspendu' : `Activé · ${mine.length} mots`}
                  </span>
                  <button className="btn btn-sm btn-outline" onClick={() => setPackSuspended(pack.id, !suspended)}>
                    {suspended ? 'Remettre en jeu' : 'Suspendre'}
                  </button>
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
