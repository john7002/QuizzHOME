import { useRef, useState } from 'react'
import { importBackup, saveBackup } from '../../data/backup'
import { useBackupStatus } from '../useBackupStatus'

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' })

export function Backup() {
  const backup = useBackupStatus()
  const fileInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string>()

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true)
    setMessage(undefined)
    try {
      await action()
      setMessage(success)
    } catch (e) {
      setMessage(`Erreur : ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  async function onImport(file: File | undefined) {
    if (!file) return
    const ok = window.confirm(
      'Importer cette sauvegarde remplace toutes les données de cet appareil (mots, joueurs, progression). Continuer ?',
    )
    if (ok) await run(() => importBackup(file), 'Sauvegarde importée.')
    if (fileInput.current) fileInput.current.value = ''
  }

  return (
    <section className="panel" style={{ maxWidth: 820 }}>
      <h2>Sauvegarde</h2>
        <p className="muted" style={{ margin: 0, fontSize: 18 }}>
          Toutes les données restent sur cet appareil. Enregistre régulièrement une sauvegarde dans l’app Fichiers (par exemple « Sur mon iPad ») :
          elle sert aussi à reprendre la partie sur un autre appareil.
        </p>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
          {backup.loading
            ? '…'
            : backup.last
              ? `Dernière sauvegarde : ${dateFormat.format(backup.last)}`
              : 'Aucune sauvegarde pour l’instant.'}
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" disabled={busy} onClick={() => run(saveBackup, 'Sauvegarde prête.')}>
            Sauvegarder maintenant
          </button>
          <button className="btn" disabled={busy} onClick={() => fileInput.current?.click()}>
            Importer une sauvegarde
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".zip,application/zip"
            hidden
            onChange={(e) => onImport(e.target.files?.[0])}
          />
        </div>
        {message && (
          <p role="status" style={{ margin: 0, fontSize: 18 }}>
            {message}
          </p>
        )}
    </section>
  )
}
