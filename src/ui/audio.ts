// Musique et effets sonores, entièrement synthétisés (aucun fichier à charger, fonctionne hors ligne).
// Coupés par défaut ; les effets et la musique s'activent séparément.

export type Effect =
  | 'tap'
  | 'retourne'
  | 'reussi'
  | 'presque'
  | 'rate'
  | 'monte'
  | 'acquis'
  | 'manche'
  | 'decouverte'
  | 'ajout'
  | 'fin'

export type Track = 'menu' | 'partie' | 'aucune'

const MUSIC_LEVEL = 0.22
const SFX_LEVEL = 0.5

let ctx: AudioContext | undefined
let sfxBus: GainNode
let musicBus: GainNode
let noiseBuffer: AudioBuffer
let effectsOn = false
let musicOn = false
let track: Track = 'aucune'
let timer: number | undefined
let step = 0
let nextStepAt = 0

function context(): AudioContext {
  if (ctx) return ctx
  ctx = new AudioContext()
  const master = ctx.createGain()
  master.connect(ctx.destination)
  sfxBus = ctx.createGain()
  sfxBus.gain.value = SFX_LEVEL
  sfxBus.connect(master)
  musicBus = ctx.createGain()
  musicBus.gain.value = MUSIC_LEVEL
  // Filtre doux : la musique reste en fond, sans aigus agressifs.
  const soften = ctx.createBiquadFilter()
  soften.type = 'lowpass'
  soften.frequency.value = 2800
  musicBus.connect(soften).connect(master)
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return ctx
}

// Sur iPad, le son passe même si l'appareil est en mode silencieux, puisqu'on l'a activé exprès.
function preferPlayback() {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
  if (session) session.type = 'playback'
}

/** À appeler lors d'un geste de l'utilisateur : les navigateurs n'autorisent le son qu'après. */
export function unlockAudio() {
  if (!effectsOn && !musicOn) return
  preferPlayback()
  const c = context()
  if (c.state === 'suspended') void c.resume().then(syncMusic)
  else syncMusic()
}

export function configureAudio(opts: { effects: boolean; music: boolean }) {
  effectsOn = opts.effects
  musicOn = opts.music
  if (ctx || effectsOn || musicOn) syncMusic()
}

export function setTrack(next: Track) {
  if (track === next) return
  track = next
  step = 0
  syncMusic()
}

// ——— Notes ———

const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

interface ToneOpts {
  type?: OscillatorType
  gain?: number
  slideTo?: number
  attack?: number
  bus?: GainNode
}

function tone(midi: number, at: number, duration: number, { type = 'triangle', gain = 0.3, slideTo, attack = 0.005, bus }: ToneOpts = {}) {
  const c = context()
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq(midi), at)
  if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(freq(slideTo), at + duration)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, at + duration)
  osc.connect(g).connect(bus ?? sfxBus)
  osc.start(at)
  osc.stop(at + duration + 0.02)
}

function noise(at: number, duration: number, { gain = 0.2, from = 800, to = 4000, bus }: { gain?: number; from?: number; to?: number; bus?: GainNode } = {}) {
  const c = context()
  const src = c.createBufferSource()
  src.buffer = noiseBuffer
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 1.2
  filter.frequency.setValueAtTime(from, at)
  filter.frequency.exponentialRampToValueAtTime(to, at + duration)
  const g = c.createGain()
  g.gain.setValueAtTime(gain, at)
  g.gain.exponentialRampToValueAtTime(0.0001, at + duration)
  src.connect(filter).connect(g).connect(bus ?? sfxBus)
  src.start(at)
  src.stop(at + duration + 0.02)
}

// ——— Effets ———

const C5 = 72

export function play(effect: Effect) {
  if (!effectsOn) return
  try {
    const c = context()
    if (c.state === 'suspended') void c.resume()
    const t = c.currentTime + 0.01
    duckMusic(effect === 'fin' || effect === 'acquis' ? 2.2 : 0.7)
    switch (effect) {
      case 'tap':
        tone(C5 + 19, t, 0.05, { type: 'sine', gain: 0.08 })
        break
      case 'retourne':
        noise(t, 0.22, { gain: 0.12, from: 600, to: 5000 })
        tone(C5 + 7, t + 0.12, 0.12, { type: 'sine', gain: 0.12 })
        break
      case 'reussi':
        ;[0, 4, 7, 12].forEach((n, i) => tone(C5 + n, t + i * 0.07, 0.22, { gain: 0.26 }))
        break
      case 'presque':
        ;[0, 2].forEach((n, i) => tone(C5 - 5 + n, t + i * 0.1, 0.22, { gain: 0.22 }))
        break
      case 'rate':
        // Doux : un mot raté est « à revoir », pas un échec.
        tone(C5 - 8, t, 0.35, { type: 'sine', gain: 0.18, slideTo: C5 - 12 })
        break
      case 'monte':
        tone(C5, t, 0.3, { type: 'square', gain: 0.07, slideTo: C5 + 12 })
        ;[19, 24, 28].forEach((n, i) => tone(C5 + n, t + 0.25 + i * 0.06, 0.18, { type: 'sine', gain: 0.1 }))
        break
      case 'acquis':
        ;[0, 4, 7].forEach((n, i) => tone(C5 + n, t + i * 0.12, 0.2, { type: 'square', gain: 0.09 }))
        ;[0, 4, 7, 12].forEach((n) => tone(C5 + n, t + 0.4, 0.9, { gain: 0.14, attack: 0.02 }))
        ;[24, 28, 31, 36].forEach((n, i) => tone(C5 + n, t + 0.45 + i * 0.07, 0.25, { type: 'sine', gain: 0.06 }))
        break
      case 'manche':
        ;[7, 12, 16].forEach((n, i) => tone(C5 - 5 + n, t + i * 0.1, 0.25, { type: 'square', gain: 0.08 }))
        noise(t + 0.3, 0.15, { gain: 0.06, from: 3000, to: 8000 })
        break
      case 'decouverte':
        tone(C5 + 12, t, 0.6, { type: 'sine', gain: 0.14 })
        tone(C5 + 19, t + 0.08, 0.6, { type: 'sine', gain: 0.08 })
        break
      case 'ajout':
        tone(C5 - 12, t, 0.12, { type: 'sine', gain: 0.25, slideTo: C5 + 7 })
        tone(C5 + 12, t + 0.12, 0.15, { type: 'triangle', gain: 0.15 })
        break
      case 'fin': {
        const melody: [number, number, number][] = [
          [0, 0, 0.14],
          [4, 0.15, 0.14],
          [7, 0.3, 0.14],
          [12, 0.45, 0.35],
          [7, 0.82, 0.14],
          [12, 0.97, 0.7],
        ]
        melody.forEach(([n, at, d]) => tone(C5 + n, t + at, d, { type: 'square', gain: 0.09 }))
        ;[-12, -5, 0, 4].forEach((n) => tone(C5 + n, t + 0.97, 1.2, { gain: 0.1, attack: 0.03 }))
        noise(t + 0.97, 0.6, { gain: 0.05, from: 4000, to: 9000 })
        break
      }
    }
  } catch {
    // Le son n'est qu'un bonus.
  }
}

function duckMusic(seconds: number) {
  if (!ctx || !musicOn) return
  const t = ctx.currentTime
  musicBus.gain.cancelScheduledValues(t)
  musicBus.gain.setTargetAtTime(MUSIC_LEVEL * 0.3, t, 0.03)
  musicBus.gain.setTargetAtTime(MUSIC_LEVEL, t + seconds, 0.3)
}

// ——— Musique ———
// Boucles de 4 mesures, en doubles croches, programmées un peu en avance.

interface Song {
  tempo: number
  /** Accords (notes MIDI), un par mesure. */
  chords: number[][]
  bass: (beat16: number) => boolean
  arp: (beat16: number) => number | undefined
  hats: boolean
}

const SONGS: Record<Exclude<Track, 'aucune'>, Song> = {
  // Calme, pour les menus : Do – La m – Fa – Sol.
  menu: {
    tempo: 88,
    chords: [
      [60, 64, 67],
      [57, 60, 64],
      [53, 57, 60],
      [55, 59, 62],
    ],
    bass: (s) => s % 8 === 0,
    arp: (s) => (s % 2 === 0 ? [0, 1, 2, 1][(s / 2) % 4] : undefined),
    hats: false,
  },
  // Plus entraînante, pour la partie : La m – Fa – Do – Sol.
  partie: {
    tempo: 108,
    chords: [
      [57, 60, 64],
      [53, 57, 60],
      [60, 64, 67],
      [55, 59, 62],
    ],
    bass: (s) => s % 4 === 0 || s % 16 === 14,
    arp: (s) => [0, 1, 2, 3, 2, 1, undefined, 2][s % 8],
    hats: true,
  },
}

function syncMusic() {
  const wanted = musicOn && track !== 'aucune' && document.visibilityState === 'visible'
  if (!wanted) {
    if (timer !== undefined) {
      clearInterval(timer)
      timer = undefined
    }
    return
  }
  const c = context()
  if (c.state === 'suspended') return // en attente d'un geste de l'utilisateur
  if (timer !== undefined) return
  nextStepAt = c.currentTime + 0.1
  timer = window.setInterval(schedule, 25)
}

function schedule() {
  if (!ctx || track === 'aucune') return
  const song = SONGS[track]
  const stepLength = 60 / song.tempo / 4
  while (nextStepAt < ctx.currentTime + 0.12) {
    const s = step % 64
    const chord = song.chords[Math.floor(s / 16)]
    const inBar = s % 16
    if (song.bass(inBar)) tone(chord[0] - 24, nextStepAt, stepLength * 3, { type: 'triangle', gain: 0.35, bus: musicBus })
    const a = song.arp(inBar)
    if (a !== undefined) {
      const note = a < 3 ? chord[a] + 12 : chord[0] + 24
      tone(note, nextStepAt, stepLength * 1.6, { type: 'square', gain: 0.06, bus: musicBus })
    }
    if (inBar === 0) chord.forEach((n) => tone(n, nextStepAt, stepLength * 15, { type: 'sine', gain: 0.05, attack: 0.3, bus: musicBus }))
    if (song.hats && inBar % 4 === 2) noise(nextStepAt, 0.04, { gain: 0.05, from: 7000, to: 9000, bus: musicBus })
    nextStepAt += stepLength
    step++
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void ctx?.suspend()
    else if (effectsOn || musicOn) void ctx?.resume().then(syncMusic)
    syncMusic()
  })
  // Un geste suffit à débloquer le son ; un petit « tic » accompagne chaque bouton.
  document.addEventListener(
    'pointerdown',
    (e) => {
      unlockAudio()
      if ((e.target as Element | null)?.closest('button, a, [role=button]')) play('tap')
    },
    { capture: true },
  )
}
