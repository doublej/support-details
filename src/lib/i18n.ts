import { ar } from './i18n/ar'
import { es } from './i18n/es'
import { fr } from './i18n/fr'
import { hi } from './i18n/hi'
import { zh } from './i18n/zh'

// Every user-facing string, in English: page copy, report labels, section titles and every
// COMMON value, plus NOT_AVAILABLE. Language files translate each key; lookup falls back to
// the key itself, so English needs no file and tests stay English by default.
export const KEYS = [
  // Page chrome and send flow.
  'Device details for support',
  'Device details someone sent you',
  'Received',
  'Reading your device…',
  'Check this device instead',
  'Check my device',
  'Your device details, ready to send.',
  'Device details someone sent you.',
  'My device details',
  'Send your details',
  'Report actions',
  'This page needs JavaScript to read your device. Turn it on in your browser settings, then reload.',
  'This browser can’t open the link.',
  'This link didn’t open.',
  'It is too old to unpack the details. Open the link on a computer or a newer phone, or ask the sender to use {action} and send that instead.',
  'Part of it was probably cut off when it was sent. Ask the sender to tap {action} and send it again.',
  'Someone helping you needs to know which phone, browser and screen you use. It is all on this page. Tap {action} to send it to them.',
  'Need the details of your phone instead?',
  'Point your phone’s camera at this code. The page opens on the phone and reads that phone.',
  'Captured {date}, your time. Everything below describes the sender’s device, not the one you are using now.',
  'Note from the sender',
  'Copy as JSON',
  'Copied as JSON.',
  'Copy link',
  'Link copied.',
  'Link copied. Paste it into your chat or email.',
  'Share link',
  'Copy as text',
  'All details copied as text.',
  'Copied “{label}”.',
  'This browser blocked copying. Select the text and copy it yourself.',
  // Report view.
  'At a glance',
  'All details',
  'Tap a line to copy it.',
  'lines',
  'Not available in this browser: {labels}.',
  // Send panel.
  'Send it',
  'Add a note',
  '(optional)',
  'Your name, ticket number, or what went wrong',
  'Other ways to send',
  'Email it',
  'Your link',
  // Share guide.
  'How to send it',
  'Tap “Share link”',
  'Pick the app you are talking in',
  'Send it.',
  'at the bottom of the screen. Your phone opens its share menu.',
  ', like WhatsApp, Messages, Mail, Teams or Slack.',
  'When they open the link, they see this page with your details filled in.',
  'No share menu, or nothing happens? Tap {copyLink}. Then press and hold in the message box and choose {paste}. On a computer, click in the message box and press Ctrl+V (⌘V on a Mac).',
  'Paste',
  'What is in the link, and is it safe?',
  'The details are packed into the link itself. Nothing is uploaded or saved on this website.',
  'It holds what you see on this page: device, browser, screen and settings. Every website you visit can already read these.',
  'No name (unless you add one in the note), no exact location (only your time zone and language), no IP address, no photos, no passwords.',
  'Anyone who has the link can read it, so send it only to the person helping you.',
  // Phone QR and credits.
  'QR code that opens this page on a phone',
  'Made by',
  // Plain-text export.
  'Device details, captured {date}',
  'Note',
  'View as a page',
  // Glance card and section titles.
  'Device',
  'System',
  'Browser',
  'Screen',
  'Appearance & accessibility',
  'Permissions & media',
  'Browser features',
  'Network',
  'Language & time',
  // Row labels: device, browser, screen.
  'Platform code',
  'Processor',
  'CPU cores',
  'Memory',
  'Battery',
  'Touch screen',
  'Main input',
  'Can hover',
  'User agent',
  'Exact versions',
  'Cookies',
  'Do Not Track',
  'Global Privacy Control',
  'Built-in PDF viewer',
  'Opened as installed app',
  'Screen size',
  'Screen in device pixels',
  'Pixel ratio',
  'Browser window',
  'Pinch zoom',
  'Orientation',
  'Color depth',
  'Color range',
  'HDR',
  // Row labels: appearance, permissions, features.
  'Dark mode',
  'Text size',
  'Reduce motion',
  'Increase contrast',
  'Reduce transparency',
  'High contrast mode',
  'Inverted colors',
  'Camera access',
  'Microphone access',
  'Location access',
  'Camera found',
  'Microphone found',
  'Video formats it can play',
  'Graphics',
  'Graphics vendor',
  'WebGL 2',
  'WebGL',
  'WebGPU',
  'WebAssembly',
  'Local storage',
  'Storage quota',
  'Websites can work offline',
  'Notifications',
  'Passkeys',
  'Share menu',
  'Websites can use Bluetooth',
  'Websites can use USB',
  // Row labels: network, language and time.
  'Connection type',
  'Connection quality (browser estimate)',
  'Data saver',
  'Time zone',
  'UTC offset',
  'Local time',
  'Clock accuracy',
  'Preferred languages',
  'Region format',
  'Number format',
  'Clock style',
  'Calendar',
  // COMMON states and answers.
  'Yes',
  'No',
  'Not supported',
  'Will ask',
  'Allowed',
  'Blocked',
  'Works',
  'Working',
  'Correct',
  'Not zoomed',
  'Default (100%)',
  'Portrait',
  'Landscape',
  'Touch',
  'Mouse or trackpad',
  'Not asked yet',
  '24-hour',
  '12-hour',
  'Mobile data',
  'Wired',
  'At least 8 GB',
  'At least 4 GB',
  'At least 2 GB',
  'Yes, 5 touch points',
  'Yes, 10 touch points',
  'Windows PC',
  'Android phone',
  'Android tablet',
  'Linux computer',
  'Good, 10+ Mbit/s, about 0 ms delay',
  'Good, 10+ Mbit/s, about 25 ms delay',
  'Good, 10+ Mbit/s, about 50 ms delay',
  'Good, 10+ Mbit/s, about 100 ms delay',
  // COMMON names, codes and units: kept as is in every language.
  'gregory',
  'sRGB',
  'Display P3',
  '24-bit',
  '30-bit',
  '32-bit',
  'Wi-Fi',
  'Rec. 2020',
  'Mac',
  'Windows 11',
  'Windows 10',
  'MacIntel',
  'Win32',
  'iPhone',
  'iPad',
  'Linux armv8l',
  'Linux aarch64',
  'Linux x86_64',
  'arm, 64-bit',
  'x86, 64-bit',
  'Apple GPU',
  'Apple',
  'Apple Inc.',
  'Google Inc. (Apple)',
  'Google Inc. (Qualcomm)',
  'Google Inc. (ARM)',
  'Google Inc. (Intel)',
  'Google Inc. (NVIDIA)',
  'Google Inc. (AMD)',
  'H.264, HEVC, VP9, AV1, HLS streaming',
  'H.264, HEVC, VP9, AV1',
  'H.264, VP9, AV1',
  'H.264, HEVC, HLS streaming',
  'H.264, HEVC, VP9, HLS streaming',
  'UTC+00:00',
  'UTC+01:00',
  'UTC+02:00',
  'UTC+03:00',
  'UTC+05:30',
  'UTC+08:00',
  'UTC+09:00',
  'UTC+10:00',
  'UTC-04:00',
  'UTC-05:00',
  'UTC-06:00',
  'UTC-07:00',
  'UTC-08:00',
  'Europe/Amsterdam',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Brussels',
  'Europe/Madrid',
  'Europe/Rome',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Australia/Sydney',
  'en',
  'en-US',
  'en-GB',
  'nl',
  'nl-NL',
  'de',
  'de-DE',
  'fr',
  'fr-FR',
  'es',
  'es-ES',
  'en-US, en',
  'en-GB, en',
  'en-GB, en-US, en',
  'nl-NL, nl',
  'nl, en-US, en',
  'nl-NL, nl, en-US, en',
  'nl-NL, nl, en-GB, en-US, en',
  'de-DE, de',
  'de-DE, de, en-US, en',
  '1,234,567.89',
  '1.234.567,89',
  '1\u202F234\u202F567,89',
  '1\u00A0234\u00A0567,89',
  '1’234’567.89',
  '12,34,567.89',
  // Missing values.
  'Not available',
] as const

export type Key = (typeof KEYS)[number]
export type Lang = 'en' | 'zh' | 'hi' | 'es' | 'ar' | 'fr'

const DICTS: Record<Exclude<Lang, 'en'>, Record<Key, string>> = { zh, hi, es, ar, fr }

/** Base subtag we can render, or null. Pure. */
export function langFromTag(tag: string): Lang | null {
  const base = tag.split('-')[0]?.toLowerCase()
  if (base === 'en') return 'en'
  if (base === 'zh' || base === 'hi' || base === 'es' || base === 'ar' || base === 'fr') {
    return base
  }
  return null
}

/** First recognized navigator language, else English. Respects the order, 'en' included. */
export function pickLanguage(tags: readonly string[] | undefined): Lang {
  for (const tag of tags ?? []) {
    const lang = langFromTag(tag)
    if (lang) return lang
  }
  return 'en'
}

/** Browser-only: the page is prerendered, so navigator may not exist. Defaults to English. */
export function currentLang(): Lang {
  if (typeof navigator === 'undefined') return 'en'
  return pickLanguage(navigator.languages ?? [navigator.language])
}

/** Manual ?lang= override from a query string. Pure: missing and unknown values give null. */
export function langFromQuery(search: string): Lang | null {
  const value = new URLSearchParams(search).get('lang')
  return value ? langFromTag(value.trim()) : null
}

const STORED_LANG_KEY = 'support-details-lang'

function readStoredLang(): Lang | null {
  try {
    return langFromTag(localStorage.getItem(STORED_LANG_KEY) ?? '')
  } catch {
    return null
  }
}

function storeLang(lang: Lang): void {
  try {
    localStorage.setItem(STORED_LANG_KEY, lang)
  } catch {
    // Blocked storage: the page still works, the choice just won't stick.
  }
}

/**
 * Manual ?lang= wins and is remembered; then the stored choice, then the browser list. The
 * query is stripped (keeping the report hash) so shared links stay language-neutral.
 * Browser-only: call it on mount.
 */
export function resolveLang(): Lang {
  const override = typeof location === 'undefined' ? null : langFromQuery(location.search)
  if (override) {
    storeLang(override)
    history.replaceState(null, '', location.pathname + location.hash)
    return override
  }
  return readStoredLang() ?? currentLang()
}

/** Translate a key; unknown keys (free-text values, crafted labels) pass through. */
export function t(lang: Lang, key: string): string {
  if (lang === 'en') return key
  return DICTS[lang][key as Key] ?? key
}

/** Fill {placeholders} in a translated template. */
export function fill(template: string, vars: Record<string, string>): string {
  let out = template
  for (const [name, value] of Object.entries(vars)) out = out.split(`{${name}}`).join(value)
  return out
}

/** Split a translated template around one {placeholder} so markup can wrap the value. */
export function parts(template: string, name: string): [before: string, after: string] {
  const marker = `{${name}}`
  const at = template.indexOf(marker)
  return at < 0 ? [template, ''] : [template.slice(0, at), template.slice(at + marker.length)]
}

/** Set the page language; only Arabic flips the direction. Browser-only. */
export function applyLang(lang: Lang): void {
  const root = document.documentElement
  root.lang = lang
  if (lang === 'ar') root.dir = 'rtl'
  else root.removeAttribute('dir')
}
