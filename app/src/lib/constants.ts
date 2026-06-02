export const ATTRS = [
  { id: 'koerper',   nm: 'KÖRPER',    ico: '💪' },
  { id: 'geist',     nm: 'GEIST',     ico: '🧠' },
  { id: 'disziplin', nm: 'DISZIPLIN', ico: '⚡' },
  { id: 'sozial',    nm: 'SOZIAL',    ico: '🤝' },
  { id: 'arbeit',    nm: 'ARBEIT',    ico: '💼' },
] as const

export const TITLES = [
  [1, 'Anfänger'], [3, 'Lehrling'], [6, 'Abenteurer'], [10, 'Veteran'],
  [15, 'Meister'], [22, 'Champion'], [30, 'Legende'], [45, 'Mythos'],
] as const

export function titleFor(level: number): string {
  let t = TITLES[0][1] as string
  for (const [min, nm] of TITLES) if (level >= min) t = nm as string
  return t
}

export function attrLevel(pts: number) { return Math.floor(pts / 100) + 1 }
export function attrProgress(pts: number) { return pts % 100 }
