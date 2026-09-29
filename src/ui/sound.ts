// Petits effets sonores synthétisés (aucun fichier à charger). Coupés par défaut.

let ctx: AudioContext | undefined

function tone(freq: number, start: number, duration: number, gain = 0.12) {
  ctx ??= new AudioContext()
  const t = ctx.currentTime + start
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.value = freq
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + duration)
  osc.connect(g).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + duration)
}

export function playSound(kind: 'reussi' | 'presque' | 'rate' | 'fin', enabled: boolean) {
  if (!enabled) return
  try {
    if (kind === 'reussi') [523, 659, 784].forEach((f, i) => tone(f, i * 0.08, 0.25))
    if (kind === 'presque') [523, 587].forEach((f, i) => tone(f, i * 0.1, 0.2))
    if (kind === 'rate') tone(330, 0, 0.3, 0.08)
    if (kind === 'fin') [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.4))
  } catch {
    // Le son n'est qu'un bonus.
  }
}
