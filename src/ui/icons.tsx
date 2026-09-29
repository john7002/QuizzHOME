// Icônes des maquettes (SVG en ligne, couleur héritée du texte).

type P = { size?: number; className?: string; style?: React.CSSProperties }

const stroke = (size: number, width = 2.4) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: width,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const IconPlay = ({ size = 40 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z" fill="currentColor" />
  </svg>
)
export const IconPause = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
    <rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
  </svg>
)
export const IconStar = ({ size = 18, className, style }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} aria-hidden>
    <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill="currentColor" />
  </svg>
)
export const IconFlame = ({ size = 30, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
    <path d="M12 2c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.8 1.2 2.8 2.3 3C10.5 8 11 5 12 2z" fill="#FF7A59" />
    <path d="M12 13c.6 1.4 2 2 2 3.5a2 2 0 0 1-4 0c0-.8.4-1.4.9-1.8.2.6.5.9.9 1 .1-1 .2-1.8.2-2.7z" fill="#FFC53D" />
  </svg>
)
export const IconSoundOff = ({ size = 26 }: P) => (
  <svg {...stroke(size, 2)}>
    <path d="M11 5L6 9H3v6h3l5 4z" />
    <path d="M22 9l-6 6M16 9l6 6" />
  </svg>
)
export const IconSoundOn = ({ size = 26 }: P) => (
  <svg {...stroke(size, 2)}>
    <path d="M11 5L6 9H3v6h3l5 4z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
)
export const IconLock = ({ size = 22 }: P) => (
  <svg {...stroke(size, 2)}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
)
export const IconCheck = ({ size = 38, width = 3.2 }: P & { width?: number }) => (
  <svg {...stroke(size, width)}>
    <path d="M5 12l5 5 9-10" />
  </svg>
)
export const IconWave = ({ size = 38 }: P) => (
  <svg {...stroke(size, 3.2)}>
    <path d="M4 14c2-4 5-4 8-2s6 2 8-2" />
  </svg>
)
export const IconRetry = ({ size = 36 }: P) => (
  <svg {...stroke(size, 3)}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
)
export const IconPlus = ({ size = 30 }: P) => (
  <svg {...stroke(size, 3)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const IconBack = ({ size = 26 }: P) => (
  <svg {...stroke(size, 2.6)}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
)
export const IconClose = ({ size = 26 }: P) => (
  <svg {...stroke(size, 2.8)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)
export const IconArrow = ({ size = 18 }: P) => (
  <svg {...stroke(size, 2.5)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)
export const IconBars = ({ size = 24 }: P) => (
  <svg {...stroke(size, 2.2)}>
    <path d="M3 20h4v-6H3zM10 20h4V9h-4zM17 20h4V4h-4z" />
  </svg>
)
export const IconList = ({ size = 20 }: P) => (
  <svg {...stroke(size, 2.4)}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
)
export const IconCamera = ({ size = 30 }: P) => (
  <svg {...stroke(size, 2.2)}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
)
export const IconChevron = ({ size = 22, style }: P) => (
  <svg {...stroke(size, 2.6)} style={style}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)
export const IconEye = ({ size = 24 }: P) => (
  <svg {...stroke(size, 2.4)}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
export const IconInfo = ({ size = 20 }: P) => (
  <svg {...stroke(size, 2.2)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.5v.5" />
  </svg>
)
export const IconTrend = ({ size = 24 }: P) => (
  <svg {...stroke(size, 2.6)}>
    <path d="M4 18l6-6 4 4 6-8" />
    <path d="M15 8h5v5" />
  </svg>
)

export function Trophy({ size = 64, color = '#FFC53D', base = '#E0A21F', outline = false }: { size?: number; color?: string; base?: string; outline?: boolean }) {
  if (outline) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <path d="M18 8h28v14a14 14 0 0 1-28 0z" fill="none" stroke={color} strokeWidth="3" />
        <path d="M18 12H9v5a9 9 0 0 0 9 9M46 12h9v5a9 9 0 0 1-9 9" fill="none" stroke={color} strokeWidth="3" />
        <rect x="20" y="45" width="24" height="9" rx="3" fill="none" stroke={color} strokeWidth="3" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <path d="M18 8h28v14a14 14 0 0 1-28 0z" fill={color} />
      <path d="M18 12H9v5a9 9 0 0 0 9 9M46 12h9v5a9 9 0 0 1-9 9" fill="none" stroke={color} strokeWidth="4" />
      <rect x="29" y="35" width="6" height="10" fill={base} />
      <rect x="20" y="45" width="24" height="9" rx="3" fill={color} />
    </svg>
  )
}

export const Crown = ({ size = 30 }: P) => (
  <svg width={size} height={size * 0.78} viewBox="0 0 24 18" aria-hidden>
    <path d="M2 5l5 4 5-7 5 7 5-4-2 12H4z" fill="#FFC53D" stroke="#120F2A" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
)
