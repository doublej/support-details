import type { Hints } from './ua'

// Chromium-only or non-standard navigator APIs. Any of them may be missing.
export type HighEntropy = Hints & {
  architecture?: string
  bitness?: string
  fullVersionList?: { brand: string; version: string }[]
}
export type Connection = {
  type?: string
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
}
export type Nav = Navigator & {
  deviceMemory?: number
  globalPrivacyControl?: boolean
  connection?: Connection
  userAgentData?: { getHighEntropyValues(hints: string[]): Promise<HighEntropy> }
  getBattery?: () => Promise<{ level: number; charging: boolean }>
}

export const NOT_SUPPORTED = 'Not supported'

export function yesNo(flag: boolean | undefined): string | null {
  if (flag === undefined) return null
  return flag ? 'Yes' : 'No'
}

export const size = (width: number, height: number) =>
  `${Math.round(width)} × ${Math.round(height)}`

// First matching media query, as its label. A feature the browser doesn't know matches nothing
// and gives null, so "No" only ever means the browser actually answered.
export const firstQuery = (options: [query: string, label: string][]) =>
  options.find(([query]) => matchMedia(query).matches)?.[1] ?? null

export const preference = (feature: string, on: string, off: string) =>
  firstQuery([
    [`(${feature}: ${on})`, 'Yes'],
    [`(${feature}: ${off})`, 'No'],
  ])

// Optional async APIs can reject (permissions policy, private mode, unknown names) or never
// settle in some browsers. None may hold up the page: each gets 1.5 s, then counts as missing.
export function settle<T>(promise: Promise<T> | undefined): Promise<T | null> {
  if (!promise) return Promise.resolve(null)
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))
  return Promise.race([promise.catch(() => null), timeout])
}
