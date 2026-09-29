import { useEffect } from 'react'
import { configureAudio, setTrack, type Track } from './audio'
import { useSettings } from './common'

/** Choisit la musique de fond de l'écran affiché. */
export function useTrack(track: Track) {
  useEffect(() => setTrack(track), [track])
}

/** Applique les réglages Son / Musique au moteur audio. */
export function AudioSync() {
  const settings = useSettings()
  useEffect(() => configureAudio({ effects: settings.sound, music: settings.music }), [settings.sound, settings.music])
  return null
}
