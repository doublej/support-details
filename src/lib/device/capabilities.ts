import type { Row, Section } from '../report'
import { type Connection, type Nav, NOT_SUPPORTED, settle, yesNo } from './probe'

const NOTIFICATIONS: Record<string, string> = {
  default: 'Not asked yet',
  granted: 'Allowed',
  denied: 'Blocked',
}
const ACCESS: Record<string, string> = { granted: 'Allowed', denied: 'Blocked', prompt: 'Will ask' }
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
const CODECS: [label: string, type: string][] = [
  ['H.264', 'video/mp4; codecs="avc1.42E01E"'],
  ['HEVC', 'video/mp4; codecs="hvc1.1.6.L93.B0"'],
  ['VP9', 'video/webm; codecs="vp9"'],
  ['AV1', 'video/mp4; codecs="av01.0.05M.08"'],
  ['HLS streaming', 'application/vnd.apple.mpegurl'],
]

export type Media = {
  camera: string | null
  microphone: string | null
  location: string | null
  devices: MediaDeviceInfo[] | null
}

// Reading a permission's state never shows a prompt. Unknown names reject, which settle absorbs.
async function readPermission(name: string): Promise<string | null> {
  const status = await settle(navigator.permissions?.query({ name } as PermissionDescriptor))
  return status ? (ACCESS[status.state] ?? status.state) : null
}

export async function readMedia(): Promise<Media> {
  const [camera, microphone, location, devices] = await Promise.all([
    readPermission('camera'),
    readPermission('microphone'),
    readPermission('geolocation'),
    settle(navigator.mediaDevices?.enumerateDevices()),
  ])
  return { camera, microphone, location, devices }
}

// The server's Date header (1 s resolution) against this clock, at the request midpoint. A wrong
// clock breaks sign-in codes and secure connections. Same-origin HEAD: no report data is sent.
export async function readClockOffset(): Promise<number | null> {
  const started = Date.now()
  const response = await settle(fetch('/', { method: 'HEAD', cache: 'no-store' }))
  const header = response?.headers.get('date')
  if (!header) return null
  return (started + Date.now()) / 2 - Date.parse(header)
}

function clockAccuracy(offset: number | null): string | null {
  if (offset === null) return null
  const seconds = Math.round(offset / 1000)
  if (Math.abs(seconds) <= 2) return 'Correct'
  const amount =
    Math.abs(seconds) < 120
      ? `${Math.abs(seconds)} seconds`
      : `${Math.round(Math.abs(seconds) / 60)} minutes`
  return `${amount} ${seconds > 0 ? 'ahead' : 'behind'}`
}

// Before access is granted, browsers list at most one unlabelled device per kind: enough to say
// whether a camera exists, not how many. An empty list means the browser hides it entirely.
function hasDevice(devices: MediaDeviceInfo[] | null, kind: MediaDeviceKind): string | null {
  if (!devices?.length) return null
  return yesNo(devices.some((device) => device.kind === kind))
}

function videoFormats(): string {
  const video = document.createElement('video')
  const playable = CODECS.filter(([, type]) => video.canPlayType(type) !== '').map(([name]) => name)
  return playable.length > 0 ? playable.join(', ') : 'None of the common formats'
}

export function mediaSection(media: Media): Section {
  return {
    title: 'Permissions & media',
    rows: [
      ['Camera access', media.camera],
      ['Microphone access', media.microphone],
      ['Location access', media.location],
      ['Camera found', hasDevice(media.devices, 'videoinput')],
      ['Microphone found', hasDevice(media.devices, 'audioinput')],
      ['Video formats it can play', videoFormats()],
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

export function featuresSection(nav: Nav, storage: StorageEstimate | null): Section {
  const notifications =
    'Notification' in window ? NOTIFICATIONS[Notification.permission] : undefined
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

export function networkSection(nav: Nav): Section {
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

export function localeSection(nav: Nav, now: Date, clockOffset: number | null): Section {
  const options = Intl.DateTimeFormat().resolvedOptions()
  return {
    title: 'Language & time',
    rows: [
      ['Time zone', options.timeZone || null],
      ['UTC offset', utcOffset(now)],
      ['Local time', now.toString()],
      ['Clock accuracy', clockAccuracy(clockOffset)],
      ['Preferred languages', nav.languages?.join(', ') || nav.language],
      ['Region format', options.locale],
      ['Number format', (1234567.89).toLocaleString()],
      ['Clock style', clockStyle()],
      ['Calendar', options.calendar],
    ],
  }
}
