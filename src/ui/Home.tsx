import { Link } from 'react-router-dom'
import { useBackupStatus } from './useBackupStatus'

export function Home() {
  const backup = useBackupStatus()

  return (
    <main className="screen">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="disp" style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 26, fontWeight: 800 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'var(--lime)',
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(-8deg)',
            }}
          >
            Q
          </div>
          <span>
            QUIZZ<span style={{ color: 'var(--lime)' }}>HOME</span>
          </span>
        </div>
        <Link to="/parents" className="btn">
          Espace parents
        </Link>
      </header>

      {backup.due && (
        <div className="banner" role="status">
          <span>{backup.last ? 'Dernière sauvegarde il y a plus de 7 jours.' : 'Aucune sauvegarde pour l’instant.'}</span>
          <Link to="/parents" className="btn" style={{ minHeight: 48 }}>
            Sauvegarder
          </Link>
        </div>
      )}

      <section className="panel" style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <h1 className="disp" style={{ margin: 0, fontSize: 46, fontWeight: 800 }}>
          Le jeu arrive bientôt.
        </h1>
        <p className="muted" style={{ margin: 0, fontSize: 20 }}>
          Squelette de l’application : stockage local, sauvegarde et installation sur l’iPad.
        </p>
        <button className="btn btn-primary disp" style={{ minHeight: 104, minWidth: 360, fontSize: 36, borderRadius: 30 }} disabled>
          JOUER
        </button>
      </section>
    </main>
  )
}
