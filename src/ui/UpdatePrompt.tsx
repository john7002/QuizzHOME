import { useRegisterSW } from 'virtual:pwa-register/react'

/** Propose d'installer la nouvelle version publiée, sans jamais interrompre une partie d'office. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="banner" role="status" style={{ position: 'fixed', left: 24, right: 24, bottom: 24, zIndex: 10 }}>
      <span>Nouvelle version disponible.</span>
      <span style={{ display: 'flex', gap: 12 }}>
        <button className="btn" style={{ minHeight: 48 }} onClick={() => setNeedRefresh(false)}>
          Plus tard
        </button>
        <button className="btn btn-primary" style={{ minHeight: 48 }} onClick={() => updateServiceWorker(true)}>
          Mettre à jour
        </button>
      </span>
    </div>
  )
}
