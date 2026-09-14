import { COMMON } from './dictionary'

/**
 * The tables compact links index into. Links already sent depend on every position, so each
 * list is append-only: never reorder, remove or reword an entry. A new collector row goes in a
 * new group at the end of GROUPS (labels.ts), and what it usually holds in LIKELY.
 */

export const GROUPS: [section: string, labels: string[]][] = [
  // '' is the glance card (Report.summary).
  ['', ['Device', 'System', 'Browser', 'Screen', 'Time zone']],
  [
    'Device',
    [
      'Platform code',
      'Processor',
      'CPU cores',
      'Memory',
      'Battery',
      'Touch screen',
      'Main input',
      'Can hover',
    ],
  ],
  [
    'Browser',
    [
      'User agent',
      'Exact versions',
      'Cookies',
      'Do Not Track',
      'Global Privacy Control',
      'Built-in PDF viewer',
      'Opened as installed app',
    ],
  ],
  [
    'Screen',
    [
      'Screen size',
      'Screen in device pixels',
      'Pixel ratio',
      'Browser window',
      'Pinch zoom',
      'Orientation',
      'Color depth',
      'Color range',
      'HDR',
    ],
  ],
  [
    'Appearance & accessibility',
    [
      'Dark mode',
      'Text size',
      'Reduce motion',
      'Increase contrast',
      'Reduce transparency',
      'High contrast mode',
      'Inverted colors',
    ],
  ],
  [
    'Permissions & media',
    [
      'Camera access',
      'Microphone access',
      'Location access',
      'Camera found',
      'Microphone found',
      'Video formats it can play',
    ],
  ],
  [
    'Browser features',
    [
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
    ],
  ],
  ['Network', ['Connection type', 'Connection quality (browser estimate)', 'Data saver']],
  [
    'Language & time',
    [
      'Time zone',
      'UTC offset',
      'Local time',
      'Clock accuracy',
      'Preferred languages',
      'Region format',
      'Number format',
      'Clock style',
      'Calendar',
    ],
  ],
]

// COMMON from one value through another, in table order.
const run = (first: string, last: string) =>
  COMMON.slice(COMMON.indexOf(first), COMMON.indexOf(last) + 1)
const YES_NO = ['Yes', 'No']
const PERMISSION = ['Will ask', 'Allowed', 'Blocked', 'Not supported']
const ZONES = run('Europe/Amsterdam', 'Australia/Sydney')

/**
 * What each row usually holds, by label: the prior a coded link (wire.ts) gives the row's value.
 * A string is a COMMON value, null is null, a number is the length of the text it tends to be
 * (62 or more: any long text). Frozen like the lists above: change an entry and links already
 * sent decode to nonsense; a new row's entry is added with the row. Rows not listed get no prior.
 */
export const LIKELY: Record<string, (string | number | null)[]> = {
  Device: [...run('Mac', 'Linux computer'), 8],
  System: [3, 5, 'Windows 11', 'Windows 10'],
  Browser: [5, 10],
  Screen: [1],
  'Time zone': [...ZONES, 12],
  'Platform code': [...run('MacIntel', 'Linux x86_64'), 8],
  Processor: ['arm, 64-bit', 'x86, 64-bit', 8],
  'CPU cores': [1, 2],
  Memory: [...run('At least 8 GB', 'At least 2 GB'), 6, null],
  Battery: [4, null],
  'Touch screen': [...YES_NO, 'Yes, 5 touch points', 'Yes, 10 touch points'],
  'Main input': ['Touch', 'Mouse or trackpad'],
  'Can hover': YES_NO,
  'User agent': [13, 15, 62],
  'Exact versions': [30, null],
  Cookies: ['Working', 'Blocked'],
  'Do Not Track': [null, ...YES_NO],
  'Global Privacy Control': [null, ...YES_NO],
  'Built-in PDF viewer': YES_NO,
  'Opened as installed app': YES_NO,
  'Screen size': [7, 8],
  'Screen in device pixels': [1],
  'Pixel ratio': [1],
  'Browser window': [7, 8],
  'Pinch zoom': ['Not zoomed', 10],
  Orientation: ['Portrait', 'Landscape'],
  'Color depth': ['24-bit', '30-bit', '32-bit'],
  'Color range': ['sRGB', 'Display P3', 'Rec. 2020'],
  HDR: YES_NO,
  'Dark mode': YES_NO,
  'Text size': ['Default (100%)', 12],
  'Reduce motion': YES_NO,
  'Increase contrast': YES_NO,
  'Reduce transparency': YES_NO,
  'High contrast mode': YES_NO,
  'Inverted colors': [null, ...YES_NO],
  'Camera access': PERMISSION,
  'Microphone access': PERMISSION,
  'Location access': PERMISSION,
  'Camera found': YES_NO,
  'Microphone found': YES_NO,
  'Video formats it can play': [
    ...run('H.264, HEVC, VP9, AV1, HLS streaming', 'H.264, HEVC, VP9, HLS streaming'),
    20,
  ],
  Graphics: [16, null],
  'Graphics vendor': [...run('Apple GPU', 'Google Inc. (AMD)'), 12],
  'WebGL 2': YES_NO,
  WebGL: YES_NO,
  WebGPU: YES_NO,
  WebAssembly: YES_NO,
  'Local storage': ['Works', 'Blocked'],
  'Storage quota': [7, null],
  'Websites can work offline': YES_NO,
  Notifications: ['Not asked yet', 'Allowed', 'Blocked', 'Not supported'],
  Passkeys: YES_NO,
  'Share menu': YES_NO,
  'Websites can use Bluetooth': YES_NO,
  'Websites can use USB': YES_NO,
  'Connection type': [null, 'Wi-Fi', 'Mobile data', 'Wired'],
  'Connection quality (browser estimate)': [
    ...run('Good, 10+ Mbit/s, about 0 ms delay', 'Good, 10+ Mbit/s, about 100 ms delay'),
    null,
  ],
  'Data saver': [...YES_NO, null],
  'UTC offset': [...run('UTC+00:00', 'UTC-08:00'), 9],
  'Local time': [5, 40],
  'Clock accuracy': ['Correct', 10],
  'Preferred languages': [...run('en', 'de-DE, de, en-US, en'), 10],
  'Region format': [...run('en', 'es-ES'), 5],
  'Number format': [...run('1,234,567.89', '12,34,567.89'), 12],
  'Clock style': ['24-hour', '12-hour'],
  Calendar: ['gregory', 8],
}
