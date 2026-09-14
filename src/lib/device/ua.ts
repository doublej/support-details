/**
 * Friendly browser, system and device names from the user agent, sharpened with Client Hints
 * where the browser offers them (Chromium and Safari freeze parts of the user agent).
 */
export type Platform = { browser: string; os: string; device: string }
export type Hints = { platform?: string; platformVersion?: string; model?: string }
type Rule = [name: string, pattern: RegExp]

// Order matters: in-app browsers and Chromium forks also carry "Chrome/" or "Safari/".
const BROWSERS: Rule[] = [
  ['Instagram in-app browser', /Instagram ([\d.]+)/],
  ['Facebook in-app browser', /FBAV\/([\d.]+)/],
  ['TikTok in-app browser', /musical_ly_([\d.]+)|BytedanceWebview/],
  ['Android WebView', /; wv\).*Chrome\/([\d.]+)/],
  ['Samsung Internet', /SamsungBrowser\/([\d.]+)/],
  ['Edge', /Edg(?:A|iOS)?\/([\d.]+)/],
  ['Opera', /OPR\/([\d.]+)/],
  ['Firefox', /(?:Firefox|FxiOS)\/([\d.]+)/],
  ['Chrome', /(?:Chrome|CriOS)\/([\d.]+)/],
  ['Safari', /Version\/([\d.]+).*Safari/],
  // WKWebView apps (WhatsApp, Gmail, LinkedIn, X) drop the Safari token entirely.
  ['In-app browser', /(?:iPhone|iPad|iPod)(?!.*Safari).*AppleWebKit/],
]

// Android before Linux and iOS before macOS: their user agents contain both names.
const SYSTEMS: Rule[] = [
  ['iPadOS', /iPad.*? OS ([\d_]+)/],
  ['iOS', /(?:iPhone|iPod).*? OS ([\d_]+)/],
  ['Android', /Android ([\d.]+)/],
  ['ChromeOS', /CrOS \S+ ([\d.]+)/],
  ['Windows', /Windows NT ([\d.]+)/],
  ['macOS', /Mac OS X ([\d_.]+)/],
  ['Linux', /Linux/],
]

const WINDOWS: Record<string, string> = { '10.0': '10 or 11', '6.3': '8.1', '6.2': '8', '6.1': '7' }
const COMPUTERS: Record<string, string> = {
  macOS: 'Mac',
  Windows: 'Windows PC',
  ChromeOS: 'Chromebook',
  Linux: 'Linux computer',
}

function firstMatch(ua: string, rules: Rule[]): [string, string] | null {
  for (const [name, pattern] of rules) {
    const found = ua.match(pattern)
    if (found) return [name, (found[1] ?? '').replace(/_/g, '.')]
  }
  return null
}

const label = ([name, version]: [string, string]) => (version ? `${name} ${version}` : name)
const safariVersion = (ua: string) => ua.match(/Version\/([\d.]+)/)?.[1] ?? ''
const major = (version: string) => Number.parseInt(version, 10) || 0

function detectSystem(ua: string, touchPoints: number): [string, string] {
  // iPadOS Safari requests desktop sites and calls itself a Mac; touch support gives it away.
  if (/Macintosh/.test(ua) && touchPoints > 1) return ['iPadOS', safariVersion(ua)]
  const [name, version] = firstMatch(ua, SYSTEMS) ?? ['Unknown system', '']
  if (name === 'Windows') return [name, WINDOWS[version] ?? version]
  // Browsers freeze macOS at 10.15 in the user agent, so that number says nothing.
  if (name === 'macOS' && version.startsWith('10.15')) return [name, '']
  // Safari 26 freezes the iOS version at 18.6 and puts the real one in Version/.
  const apple = name === 'iOS' || name === 'iPadOS'
  if (apple && major(safariVersion(ua)) > major(version)) return [name, safariVersion(ua)]
  return [name, version]
}

function detectDevice(ua: string, system: string): string {
  const apple = ua.match(/iPhone|iPad|iPod/)?.[0]
  if (apple) return apple
  if (system === 'iPadOS') return 'iPad'
  if (system !== 'Android') return COMPUTERS[system] ?? 'Unknown device'
  // Reduced Chrome user agents replace the model with "K"; Client Hints supply the real one.
  const model = ua.match(/Android [\d.]+; ([^;)]+)/)?.[1].replace(/ Build\/.*/, '')
  if (model && model !== 'K') return model
  return /Mobile/.test(ua) ? 'Android phone' : 'Android tablet'
}

export function parseUserAgent(ua: string, touchPoints = 0): Platform {
  const system = detectSystem(ua, touchPoints)
  return {
    browser: label(firstMatch(ua, BROWSERS) ?? ['Unknown browser', '']),
    os: label(system),
    device: detectDevice(ua, system[0]),
  }
}

export function refineWithHints(platform: Platform, hints: Hints): Platform {
  const version = (hints.platformVersion ?? '').replace(/(\.0)+$/, '')
  if (!version) return platform
  // Client Hints number Windows 10 as 1–10 and Windows 11 as 13 and up.
  if (hints.platform === 'Windows' && major(version) > 0) {
    return { ...platform, os: `Windows ${major(version) >= 13 ? 11 : 10}` }
  }
  if (hints.platform === 'Android') {
    return { ...platform, os: `Android ${version}`, device: hints.model || platform.device }
  }
  if (hints.platform === 'macOS') return { ...platform, os: `macOS ${version}` }
  return platform
}
