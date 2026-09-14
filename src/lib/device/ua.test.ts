import { describe, expect, it } from 'vitest'
import { type Platform, parseUserAgent, refineWithHints } from './ua'

const IPHONE_SAFARI_26 =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1'
const MAC_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
const ANDROID_REDUCED =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'
const SAMSUNG =
  'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36'
const INSTAGRAM =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 312.0.0.32.112 (iPhone15,2; iOS 17_4; en_US; en; scale=3.00; 1179x2556; 556020187)'
const IOS_WEBVIEW =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
const CHROME_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1'
const WINDOWS_EDGE =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0'
const LINUX_FIREFOX = 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0'

const cases: [name: string, ua: string, touchPoints: number, expected: Platform][] = [
  [
    'iPhone Safari 26 with a frozen iOS version',
    IPHONE_SAFARI_26,
    5,
    { browser: 'Safari 26.0', os: 'iOS 26.0', device: 'iPhone' },
  ],
  [
    'iPad posing as a Mac',
    MAC_SAFARI,
    5,
    { browser: 'Safari 17.4', os: 'iPadOS 17.4', device: 'iPad' },
  ],
  ['real Mac', MAC_SAFARI, 0, { browser: 'Safari 17.4', os: 'macOS', device: 'Mac' }],
  [
    'Android Chrome with a reduced user agent',
    ANDROID_REDUCED,
    5,
    { browser: 'Chrome 126.0.0.0', os: 'Android 10', device: 'Android phone' },
  ],
  [
    'Samsung Internet',
    SAMSUNG,
    5,
    { browser: 'Samsung Internet 23.0', os: 'Android 13', device: 'SM-S911B' },
  ],
  [
    'Instagram in-app browser',
    INSTAGRAM,
    5,
    { browser: 'Instagram in-app browser 312.0.0.32.112', os: 'iOS 17.4', device: 'iPhone' },
  ],
  [
    'iOS app web view without a Safari token',
    IOS_WEBVIEW,
    5,
    { browser: 'In-app browser', os: 'iOS 17.4', device: 'iPhone' },
  ],
  [
    'Chrome on iPhone stays Chrome',
    CHROME_IOS,
    5,
    { browser: 'Chrome 126.0.6478.54', os: 'iOS 17.4', device: 'iPhone' },
  ],
  [
    'Windows Edge',
    WINDOWS_EDGE,
    0,
    { browser: 'Edge 126.0.0.0', os: 'Windows 10 or 11', device: 'Windows PC' },
  ],
  [
    'Linux Firefox',
    LINUX_FIREFOX,
    0,
    { browser: 'Firefox 128.0', os: 'Linux', device: 'Linux computer' },
  ],
]

describe('parseUserAgent', () => {
  for (const [name, ua, touchPoints, expected] of cases) {
    it(name, () => expect(parseUserAgent(ua, touchPoints)).toEqual(expected))
  }
})

describe('refineWithHints', () => {
  it('replaces the frozen Android version and model', () => {
    const hints = { platform: 'Android', platformVersion: '14.0.0', model: 'Pixel 8' }
    expect(refineWithHints(parseUserAgent(ANDROID_REDUCED, 5), hints)).toMatchObject({
      os: 'Android 14',
      device: 'Pixel 8',
    })
  })

  it('tells Windows 10 and 11 apart', () => {
    const windows = parseUserAgent(WINDOWS_EDGE)
    expect(refineWithHints(windows, { platform: 'Windows', platformVersion: '15.0.0' }).os).toBe(
      'Windows 11',
    )
    expect(refineWithHints(windows, { platform: 'Windows', platformVersion: '10.0.0' }).os).toBe(
      'Windows 10',
    )
    expect(refineWithHints(windows, {}).os).toBe('Windows 10 or 11')
  })
})
