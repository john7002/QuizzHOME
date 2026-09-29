// « Pour qui ? » : toute la famille, ou un ou plusieurs joueurs.

import type { Player } from '../../domain/types'

export function PlayerPicker({ players, value, onChange }: { players: Player[]; value: string[]; onChange: (ids: string[]) => void }) {
  function toggle(id: string) {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    // Tous les joueurs cochés = toute la famille.
    onChange(next.length === players.length ? [] : next)
  }

  return (
    <div className="field">
      <span className="label">
        Pour qui ? <span style={{ fontWeight: 500 }}>· un ou plusieurs joueurs</span>
      </span>
      <div className="row wrap" style={{ gap: 6 }} role="group" aria-label="Pour qui ?">
        <button className="chip-btn" aria-pressed={value.length === 0} onClick={() => onChange([])}>
          Famille
        </button>
        {players.map((p) => (
          <button key={p.id} className="chip-btn" aria-pressed={value.includes(p.id)} onClick={() => toggle(p.id)}>
            {p.name}
          </button>
        ))}
      </div>
    </div>
  )
}
