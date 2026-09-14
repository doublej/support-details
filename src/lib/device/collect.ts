import type { Report } from '../report'
import {
  featuresSection,
  localeSection,
  mediaSection,
  networkSection,
  readClockOffset,
  readMedia,
} from './capabilities'
import { type Nav, settle, size } from './probe'
import { appearanceSection, browserSection, deviceSection, screenSection } from './sections'
import { parseUserAgent, refineWithHints } from './ua'

const HINTS = ['platformVersion', 'model', 'architecture', 'bitness', 'fullVersionList']

async function readBattery(nav: Nav): Promise<string | null> {
  const battery = await settle(nav.getBattery?.())
  if (!battery) return null
  return `${Math.round(battery.level * 100)}%${battery.charging ? ', charging' : ''}`
}

/** Reads the current device into a report. Browser-only: call it after mount. */
export async function collectReport(): Promise<Report> {
  const nav = navigator as Nav
  const now = new Date()
  // Every async probe runs at once and is capped by settle, so the page waits 1.5 s at most.
  const [settledHints, battery, storage, media, clockOffset] = await Promise.all([
    settle(nav.userAgentData?.getHighEntropyValues(HINTS)),
    readBattery(nav),
    settle(nav.storage?.estimate?.()),
    readMedia(),
    readClockOffset(),
  ])
  const hints = settledHints ?? {}
  const platform = refineWithHints(parseUserAgent(nav.userAgent, nav.maxTouchPoints), hints)
  // Brave sends Chrome's user agent unchanged; only this navigator property tells them apart.
  const browser =
    'brave' in nav ? platform.browser.replace(/^Chrome /, 'Brave, Chromium ') : platform.browser
  return {
    v: 1,
    at: now.toISOString(),
    note: '',
    summary: [
      ['Device', platform.device],
      ['System', platform.os],
      ['Browser', browser],
      ['Screen', `${size(screen.width, screen.height)} at ${window.devicePixelRatio}×`],
      ['Time zone', Intl.DateTimeFormat().resolvedOptions().timeZone || null],
    ],
    sections: [
      deviceSection(nav, hints, battery),
      browserSection(nav, hints),
      screenSection(),
      appearanceSection(platform.os),
      mediaSection(media),
      featuresSection(nav, storage),
      networkSection(nav),
      localeSection(nav, now, clockOffset),
    ],
  }
}
