import type { Section } from '../report'
import { firstQuery, type HighEntropy, type Nav, preference, size, yesNo } from './probe'

export function deviceSection(nav: Nav, hints: HighEntropy, battery: string | null): Section {
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

// cookieEnabled can say yes while a privacy setting still blocks writes; a real write settles it.
function cookieStatus(): string {
  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API is missing in Firefox and older Safari
  document.cookie = 'sd_probe=1; SameSite=Strict; Max-Age=10'
  const works = document.cookie.includes('sd_probe=1')
  // biome-ignore lint/suspicious/noDocumentCookie: same probe, removed straight away
  document.cookie = 'sd_probe=; SameSite=Strict; Max-Age=0'
  return works ? 'Working' : 'Blocked'
}

export function browserSection(nav: Nav, hints: HighEntropy): Section {
  const versions = hints.fullVersionList
    ?.filter(({ brand }) => !brand.includes('Brand'))
    .map(({ brand, version }) => `${brand} ${version}`)
  return {
    title: 'Browser',
    rows: [
      ['User agent', nav.userAgent],
      ['Exact versions', versions?.join(', ') || null],
      ['Cookies', cookieStatus()],
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

// Pinch zoom explains "everything is huge" or "the buttons are off screen".
function pinchZoom(): string | null {
  const scale = window.visualViewport?.scale
  if (scale === undefined) return null
  return scale === 1 ? 'Not zoomed' : `Zoomed to ${Math.round(scale * 100)}%`
}

export function screenSection(): Section {
  const ratio = window.devicePixelRatio
  return {
    title: 'Screen',
    rows: [
      ['Screen size', size(screen.width, screen.height)],
      ['Screen in device pixels', size(screen.width * ratio, screen.height * ratio)],
      ['Pixel ratio', String(ratio)],
      ['Browser window', size(window.innerWidth, window.innerHeight)],
      ['Pinch zoom', pinchZoom()],
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
// 17px at the default setting (per WebKit, not checked on every device). Elsewhere the root
// font size follows the browser's text size setting, 16px by default.
function textSize(os: string): string {
  if (!/^i(Pad)?OS/.test(os)) return scale(getComputedStyle(document.documentElement).fontSize, 16)
  const probe = document.createElement('span')
  probe.style.font = '-apple-system-body'
  document.body.append(probe)
  const fontSize = getComputedStyle(probe).fontSize
  probe.remove()
  return scale(fontSize, 17)
}

export function appearanceSection(os: string): Section {
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
