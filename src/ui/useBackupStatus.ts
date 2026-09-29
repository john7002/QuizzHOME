import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../data/db'
import { backupIsDue } from '../data/backup'

export function useBackupStatus() {
  const last = useLiveQuery(async () => (await db.meta.get('lastBackupAt'))?.value as number | undefined, [], null)
  const loading = last === null
  return {
    loading,
    last: loading ? undefined : last,
    due: !loading && backupIsDue(last),
  }
}
