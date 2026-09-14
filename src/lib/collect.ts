import type { Report, Row, Section } from './report'
import { type Hints, parseUserAgent, refineWithHints } from './ua'

// Chromium-only or non-standard navigator APIs. Any of them may be missing.
type HighEntropy = Hints & {
  architecture?: string
  bitness?: string
  fullVersionList?: { brand: string; version: string }[]
}
type Connection = {
  type?: string
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
}
type Nav = Navigator & {
  deviceMemory?: number
  globalPrivacyControl?: boolean
  connection?: Connection
  userAgentData?: { getHighEntropyValues(hints: string[]): Promise<HighEntropy> }
  getBattery?: () => Promise<{ level: number; charging: boolean }>
}

const HINTS = ['platformVersion', 'model', 'architecture', 'bitness', 'fullVersionList']
const PERMISSIONS: Record<string, string> = {
  default: 'Not asked yet',
  granted: 'Allowed',
  denied: 'Blocked',
}
// Network Information API values are estimates from recent traffic, not the radio: "4g" also
// shows on Wi-Fi, downlink is capped at 10 Mbit/s and rtt is rounded to 25 ms.
const QUALITY: Record<string, string> = {
  'slow-2g': 'Very slow',
  '2g': 'Slow',
  '3g': 'OK',
  '4g': 'Good',
}
const CONNECTION_TYPES: Record<string, string> = {
  wifi: 'Wi-Fi',
  cellular: 'Mobile data',
  ethernet: 'Wired',
  bluetooth: 'Bluetooth tethering',
  none: 'No connection',
}

function yesNo(flag: boolean | undefined): string | null {
  if (flag === undefined) return null
  return flag ? 'Yes' : 'No'
}

const size = (width: number, height: number) => `${Math.round(width)} × ${Math.round(height)}`

// First matching media query, as its label. A feature the browser doesn't know matches nothing
// and gives null, so "No" only ever means the browser actually answered.
const firstQuery = (options: [query: string, label: string][]) =>
  options.find(([query]) => matchMedia(query).matches)?.[1] ?? null

const preference = (feature: string, on: string, off: string) =>
  firstQuery([
    [`(${feature}: ${on})`, 'Yes'],
    [`(${feature}: ${off})`, 'No'],
  ])

// Optional async APIs can reject (permissions policy, private mode) or never settle in some
// browsers. None may hold up the page, so each gets 1.5 s and then counts as not available.
function settle<T>(promise: Promise<T> | undefined): Promise<T | null> {
  if (!promise) return Promise.resolve(null)
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))
  return Promise.race([promise.catch(() => null), timeout])
}

async function readBattery(nav: Nav): Promise<string | null> {
  const battery = await settle(nav.getBattery?.())
  if (!battery) return null
  return `${Math.round(battery.level * 100)}%${battery.charging ? ', charging' : ''}`
}

function deviceSection(nav: Nav, hints: HighEntropy, battery: string | null): Section {
  const bits = hints.bitness ? `${hints.bitness}-bit` : ''
  const processor = [hints.architecture, bits].filter(Boolean).join(', ')
  return {
    title: 'Device',
    rows: [
      ['Platform code', nav.platform || null],
      ['Processor', processor || null],
      ['CPU cores', nav.hardwareConcurrency ? String(nav.hardwareConcurrency) : null],
      // Browsers round memory down and cap it, so this is a lower bound.
      ['Memory', nav.deviceMemory ? `At least ${nav.deviceMemory} GB` : null],
      ['Battery', battery],
      ['Touch screen', nav.maxTouchPoints > 0 ? `Yes, ${nav.maxTouchPoints} touch points` : 'No'],
      [
        'Main input',
        firstQuery([
          ['(pointer: coarse)', 'Touch'],
          ['(pointer: fine)', 'Mouse or trackpad'],
        ]),
      ],
      ['Can hover', preference('hover', 'hover', 'none')],
    ],
  }
}

function browserSection(nav: Nav, hints: HighEntropy): Section {
  const versions = hints.fullVersionList
    ?.filter(({ brand }) => !brand.includes('Brand'))
    .map(({ brand, version }) => `${brand} ${version}`)
  return {
    title: 'Browser',
    rows: [
      ['User agent', nav.userAgent],
      ['Exact versions', versions?.join(', ') || null],
      ['Cookies enabled', yesNo(nav.cookieEnabled)],
      ['Do Not Track', yesNo(nav.doNotTrack ? nav.doNotTrack === '1' : undefined)],
      ['Global Privacy Control', yesNo(nav.globalPrivacyControl)],
      ['Built-in PDF viewer', yesNo(nav.pdfViewerEnabled)],
      ['Opened as installed app', preference('display-mode', 'standalone', 'browser')],
    ],
  }
}

function orientation(type: string | undefined): string | null {
  if (!type) return null
  return type.startsWith('portrait') ? 'Portrait' : 'Landscape'
}

function screenSection(): Section {
  const ratio = window.devicePixelRatio
  return {
    title: 'Screen',
    rows: [
      ['Screen size', size(screen.width, screen.height)],
      ['Screen in device pixels', size(screen.width * ratio, screen.height * ratio)],
      ['Pixel ratio', String(ratio)],
      ['Browser window', size(window.innerWidth, window.innerHeight)],
      ['Orientation', orientation(screen.orientation?.type)],
      ['Color depth', `${screen.colorDepth}-bit`],
      [
        'Color range',
        firstQuery([
          ['(color-gamut: rec2020)', 'Rec. 2020'],
          ['(color-gamut: p3)', 'Display P3'],
          ['(color-gamut: srgb)', 'sRGB'],
        ]),
      ],
      ['HDR', preference('dynamic-range', 'high', 'standard')],
    ],
  }
}

function scale(fontSize: string, base: number): string {
  const percent = Math.round((Number.parseFloat(fontSize) / base) * 100)
  return percent === 100 ? 'Default (100%)' : `${percent}% of default`
}

// iOS Dynamic Type leaves the root font size alone but moves the system body font, which is
// 17px at the default setting (verified in WebKit docs, not on every device). Elsewhere the
// root font size follows the browser's text size setting, 16px by default.
function textSize(os: string): string {
  if (!/^i(Pad)?OS/.test(os)) return scale(getComputedStyle(document.documentElement).fontSize, 16)
  const probe = document.createElement('span')
  probe.style.font = '-apple-system-body'
  document.body.append(probe)
  const fontSize = getComputedStyle(probe).fontSize
  probe.remove()
  return scale(fontSize, 17)
}

function appearanceSection(os: string): Section {
  return {
    title: 'Appearance & accessibility',
    rows: [
      ['Dark mode', preference('prefers-color-scheme', 'dark', 'light')],
      ['Text size', textSize(os)],
      ['Reduce motion', preference('prefers-reduced-motion', 'reduce', 'no-preference')],
      ['Increase contrast', preference('prefers-contrast', 'more', 'no-preference')],
      [
        'Reduce transparency',
        preference('prefers-reduced-transparency', 'reduce', 'no-preference'),
      ],
      ['High contrast mode', preference('forced-colors', 'active', 'none')],
      ['Inverted colors', preference('inverted-colors', 'inverted', 'none')],
    ],
  }
}

function graphicsRows(): Row[] {
  const gl = document.createElement('canvas').getContext('webgl')
  if (!gl) return [['WebGL', NOT_SUPPORTED]]
  // The debug extension exposes the real GPU name where the browser allows it.
  const debug = gl.getExtension('WEBGL_debug_renderer_info')
  return [
    ['Graphics', String(gl.getParameter(debug?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER))],
    ['Graphics vendor', String(gl.getParameter(debug?.UNMASKED_VENDOR_WEBGL ?? gl.VENDOR))],
    ['WebGL 2', yesNo(Boolean(document.createElement('canvas').getContext('webgl2')))],
  ]
}

const NOT_SUPPORTED = 'Not supported'

// Some private modes expose localStorage but throw on write. That is exactly what support needs.
function localStorageStatus(): string {
  try {
    localStorage.setItem('support-details-probe', '1')
    localStorage.removeItem('support-details-probe')
    return 'Works'
  } catch {
    return 'Blocked'
  }
}

function featuresSection(nav: Nav, storage: StorageEstimate | null): Section {
  const notifications = 'Notification' in window ? PERMISSIONS[Notification.permission] : undefined
  return {
    title: 'Browser features',
    rows: [
      ...graphicsRows(),
      ['WebGPU', yesNo('gpu' in nav)],
      ['WebAssembly', yesNo(typeof WebAssembly === 'object')],
      ['Local storage', localStorageStatus()],
      ['Storage quota', storage?.quota ? `${(storage.quota / 1e9).toFixed(1)} GB` : null],
      ['Websites can work offline', yesNo('serviceWorker' in nav)],
      ['Notifications', notifications ?? NOT_SUPPORTED],
      ['Passkeys', yesNo('PublicKeyCredential' in window)],
      ['Share menu', yesNo('share' in nav)],
      ['Websites can use Bluetooth', yesNo('bluetooth' in nav)],
      ['Websites can use USB', yesNo('usb' in nav)],
    ],
  }
}

function connectionQuality(connection: Connection | undefined): string | null {
  if (!connection?.effectiveType) return null
  const parts = [QUALITY[connection.effectiveType] ?? connection.effectiveType]
  if (connection.downlink !== undefined) {
    parts.push(connection.downlink >= 10 ? '10+ Mbit/s' : `about ${connection.downlink} Mbit/s`)
  }
  if (connection.rtt !== undefined) parts.push(`about ${connection.rtt} ms delay`)
  return parts.join(', ')
}

function networkSection(nav: Nav): Section {
  const type = nav.connection?.type
  return {
    title: 'Network',
    rows: [
      ['Connection type', type ? (CONNECTION_TYPES[type] ?? type) : null],
      ['Connection quality (browser estimate)', connectionQuality(nav.connection)],
      ['Data saver', yesNo(nav.connection?.saveData)],
    ],
  }
}

function utcOffset(date: Date): string {
  const minutes = -date.getTimezoneOffset()
  const hours = String(Math.floor(Math.abs(minutes) / 60)).padStart(2, '0')
  return `UTC${minutes < 0 ? '-' : '+'}${hours}:${String(Math.abs(minutes) % 60).padStart(2, '0')}`
}

function clockStyle(): string | null {
  const cycle = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hourCycle
  if (!cycle) return null
  return cycle === 'h11' || cycle === 'h12' ? '12-hour' : '24-hour'
}

function localeSection(nav: Nav, now: Date): Section {
  const options = Intl.DateTimeFormat().resolvedOptions()
  return {
    title: 'Language & time',
    rows: [
      ['Time zone', options.timeZone || null],
      ['UTC offset', utcOffset(now)],
      ['Local time', now.toString()],
      ['Preferred languages', nav.languages?.join(', ') || nav.language],
      ['Region format', options.locale],
      ['Number format', (1234567.89).toLocaleString()],
      ['Clock', clockStyle()],
      ['Calendar', options.calendar],
    ],
  }
}

/** Reads the current device into a report. Browser-only: call it after mount. */
export async function collectReport(): Promise<Report> {
  const nav = navigator as Nav
  const now = new Date()
  const [settledHints, battery, storage] = await Promise.all([
    settle(nav.userAgentData?.getHighEntropyValues(HINTS)),
    readBattery(nav),
    settle(nav.storage?.estimate?.()),
  ])
  const hints = settledHints ?? {}
  const platform = refineWithHints(parseUserAgent(nav.userAgent, nav.maxTouchPoints), hints)
  return {
    v: 1,
    at: now.toISOString(),
    note: '',
    summary: [
      ['Device', platform.device],
      ['System', platform.os],
      ['Browser', platform.browser],
      ['Screen', `${size(screen.width, screen.height)} at ${window.devicePixelRatio}×`],
      ['Time zone', Intl.DateTimeFormat().resolvedOptions().timeZone || null],
    ],
    sections: [
      deviceSection(nav, hints, battery),
      browserSection(nav, hints),
      screenSection(),
      appearanceSection(platform.os),
      featuresSection(nav, storage),
      networkSection(nav),
      localeSection(nav, now),
    ],
  }
}
