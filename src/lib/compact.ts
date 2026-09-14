import type { Report, Row } from './report'

/**
 * Compact links carry values only. Labels, common values and common text fragments live in the
 * lists below, and links already sent index into them, so every list is append-only: never
 * reorder, remove or reword an entry. A new collector row goes in a new group at the end.
 */
const GROUPS: [section: string, labels: string[]][] = [
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

// Whole values that repeat across devices, sent as their position + 1.
const COMMON = [
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
  'gregory',
  'sRGB',
  'Display P3',
  '24-bit',
  '30-bit',
  'Wi-Fi',
  'Mobile data',
  'Wired',
]

// Text that recurs inside values (user agents, GPU names, time zones). Each fragment becomes one
// private-use character before compression: a hand-made preset dictionary, because
// CompressionStream can't take a real one. Measured on a Mac report: 1729 → 531 characters.
const FRAGMENTS = [
  'Mozilla/5.0 (',
  ') AppleWebKit/537.36 (KHTML, like Gecko) Chrome/',
  ' Mobile Safari/537.36',
  ' Safari/537.36',
  ') AppleWebKit/605.1.15 (KHTML, like Gecko) ',
  'Macintosh; Intel Mac OS X 10_15_7',
  'iPhone; CPU iPhone OS ',
  'iPad; CPU OS ',
  ' like Mac OS X',
  'Mobile/15E148 Safari/604.1',
  'Windows NT 10.0; Win64; x64',
  'Linux; Android ',
  'Chromium ',
  'Google Chrome ',
  'Microsoft Edge ',
  'ANGLE (',
  'ANGLE Metal Renderer: ',
  ', Unspecified Version)',
  'Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'Google Inc. (',
  'H.264, ',
  'HEVC, ',
  'VP9, ',
  'AV1, ',
  'HLS streaming',
  ' GMT',
  ' Standard Time)',
  ' Summer Time)',
  ' Daylight Time)',
  'Europe/',
  'America/',
  ' Mbit/s, about ',
  ' ms delay',
  'At least ',
  ' × ',
  'Yes, ',
  ' touch points',
]

type Extra = [section: string, label: string, value: string | null]
// A number is null (0), absent (-1) or a COMMON value; a string has fragment tokens; [text] is
// verbatim text that already held a private-use character.
type Value = number | string | [string]
export type Packed = [at: string, note: string, values: Value[], extras?: Extra[]]

const NOT_A_REPORT = 'Not a device report'
const NULL = 0
const ABSENT = -1
const FIRST_TOKEN = 0xe000
const PRIVATE_USE = /[\uE000-\uF8FF]/g
const HAS_PRIVATE_USE = /[\uE000-\uF8FF]/

const FIELDS = GROUPS.flatMap(([section, labels]) =>
  labels.map((label): [string, string] => [section, label]),
)
const INDEX = new Map(FIELDS.map(([section, label], index) => [`${section}\n${label}`, index]))
// Longest first, so ' Mobile Safari/537.36' is taken whole before ' Safari/537.36' can match.
const TOKENS = FRAGMENTS.map((fragment, i) => [
  fragment,
  String.fromCharCode(FIRST_TOKEN + i),
]).sort((a, b) => b[0].length - a[0].length)

const squeeze = (text: string) =>
  TOKENS.reduce((out, [fragment, token]) => out.split(fragment).join(token), text)

const expand = (text: string) =>
  text.replace(PRIVATE_USE, (token) => {
    const fragment = FRAGMENTS[token.charCodeAt(0) - FIRST_TOKEN]
    if (fragment === undefined) throw new Error(NOT_A_REPORT)
    return fragment
  })

function packValue(value: string | null): Value {
  if (value === null) return NULL
  const common = COMMON.indexOf(value)
  if (common !== -1) return common + 1
  return HAS_PRIVATE_USE.test(value) ? [value] : squeeze(value)
}

function unpackValue(packed: unknown): string | null {
  if (packed === NULL) return null
  if (typeof packed === 'string') return expand(packed)
  if (Array.isArray(packed) && packed.length === 1 && typeof packed[0] === 'string') {
    return packed[0]
  }
  const common =
    typeof packed === 'number' && Number.isInteger(packed) ? COMMON[packed - 1] : undefined
  if (common === undefined) throw new Error(NOT_A_REPORT)
  return common
}

const rowsOf = (report: Report): [string, Row][] => [
  ...report.summary.map((row): [string, Row] => ['', row]),
  ...report.sections.flatMap(({ title, rows }) => rows.map((row): [string, Row] => [title, row])),
]

export function packReport(report: Report): Packed {
  const values: Value[] = FIELDS.map(() => ABSENT)
  const extras: Extra[] = []
  for (const [section, [label, value]] of rowsOf(report)) {
    const index = INDEX.get(`${section}\n${label}`)
    // Rows missing from the table and repeated rows travel verbatim, so nothing is ever lost.
    if (index === undefined || values[index] !== ABSENT) extras.push([section, label, value])
    else values[index] = packValue(value)
  }
  if (import.meta.env?.DEV && extras.length > 0)
    console.warn('Rows sent verbatim; add them to GROUPS in compact.ts:', extras)
  while (values.length > 0 && values[values.length - 1] === ABSENT) values.pop()
  const at = Math.round(Date.parse(report.at) / 1000).toString(36)
  return extras.length > 0 ? [at, report.note, values, extras] : [at, report.note, values]
}

const isExtra = (extra: unknown): extra is Extra =>
  Array.isArray(extra) &&
  typeof extra[0] === 'string' &&
  typeof extra[1] === 'string' &&
  (typeof extra[2] === 'string' || extra[2] === null)

const isPacked = (data: unknown): data is Packed =>
  Array.isArray(data) &&
  typeof data[0] === 'string' &&
  typeof data[1] === 'string' &&
  Array.isArray(data[2]) &&
  data[2].length <= FIELDS.length &&
  (data[3] === undefined || (Array.isArray(data[3]) && data[3].every(isExtra)))

/** A shared link is untrusted: anything off-table or off-type rejects the whole link. */
export function unpackReport(data: unknown): Report {
  if (!isPacked(data)) throw new Error(NOT_A_REPORT)
  const [at, note, values, extras = []] = data
  // Sections come out in table order; extra sections follow in the order they were sent.
  const sections = new Map<string, Row[]>(GROUPS.map(([section]) => [section, []]))
  const add = (section: string, row: Row) =>
    sections.set(section, [...(sections.get(section) ?? []), row])
  values.forEach((packed, index) => {
    if (packed !== ABSENT) add(FIELDS[index][0], [FIELDS[index][1], unpackValue(packed)])
  })
  for (const [section, label, value] of extras) add(section, [label, value])
  const summary = sections.get('') ?? []
  sections.delete('')
  return {
    v: 1,
    at: new Date(Number.parseInt(at, 36) * 1000).toISOString(),
    note,
    summary,
    sections: [...sections]
      .filter(([, rows]) => rows.length > 0)
      .map(([title, rows]) => ({ title, rows })),
  }
}
