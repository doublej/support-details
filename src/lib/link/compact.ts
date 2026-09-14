import type { Report, Row } from '../report'
import { COMMON, FRAGMENTS } from './dictionary'
import { GROUPS } from './labels'

/**
 * Compact links carry values only. Labels, common values and common text fragments live in the
 * append-only tables of labels.ts and dictionary.ts, and links already sent index into them.
 *
 * Every FRAGMENTS and DERIVED entry is one token character, and the wire format (wire.ts) sends a
 * token as one byte: 128 slots in all, FRAGMENTS counting up from the first, DERIVED down from
 * the last. On the wire each value is coded under its field's model, primed with the values
 * LIKELY (labels.ts) expects in that row, so a Yes where a Yes is expected costs about a bit.
 */
type Extra = [section: string, label: string, value: string | null]
// A number is null (0), absent (-1) or a COMMON value; a string has fragment tokens; [text] is
// verbatim text that already held a private-use character.
type Value = number | string | [string]
export type Packed = [at: string, note: string, values: Value[], extras?: Extra[]]
type Fragments = [fragment: string, token: string][]
type Lookup = (section: string, label: string) => string | null

const NOT_A_REPORT = 'Not a device report'
const NULL = 0
const ABSENT = -1
export const FIRST_TOKEN = 0xe000
const LAST_TOKEN = FIRST_TOKEN + 127
const PRIVATE_USE = /[\uE000-\uF8FF]/g
const HAS_PRIVATE_USE = /[\uE000-\uF8FF]/
const NONE = new Map<string, string>()

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const two = (n: number) => String(n).padStart(2, '0')

// Date.toString() up to the zone name, 'Mon Sep 14 2026 14:09:55 GMT+0200', from the capture
// time and the 'UTC offset' row; the collector reads both from one Date.
function localTime(seconds: number, offset: string | null): string {
  const match = /^UTC([+-])(\d\d):(\d\d)$/.exec(offset ?? '')
  if (!match) return ''
  const shift = (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 3600 + Number(match[3]) * 60)
  const local = new Date((seconds + shift) * 1000)
  const date = `${DAYS[local.getUTCDay()]} ${MONTHS[local.getUTCMonth()]} ${two(local.getUTCDate())}`
  const time = [local.getUTCHours(), local.getUTCMinutes(), local.getUTCSeconds()].map(two)
  return `${date} ${local.getUTCFullYear()} ${time.join(':')} GMT${match[1]}${match[2]}${match[3]}`
}

function devicePixels(size: string | null, ratio: string | null): string {
  const match = /^(\d+) × (\d+)$/.exec(size ?? '')
  if (!match || !ratio) return ''
  const scale = (side: string) => Math.round(Number(side) * Number(ratio))
  return `${scale(match[1])} × ${scale(match[2])}`
}

// Text other rows determine, one token each: the sender swaps it out when it matches its value
// exactly, the reader derives it again from the rows it unpacks. Append-only like the lists.
const DERIVED: ((seconds: number, row: Lookup) => string)[] = [
  (_, row) => {
    const size = row('Screen', 'Screen size')
    const ratio = row('Screen', 'Pixel ratio')
    return size && ratio ? `${size} at ${ratio}×` : ''
  },
  (seconds, row) => localTime(seconds, row('Language & time', 'UTC offset')),
  (_, row) => devicePixels(row('Screen', 'Screen size'), row('Screen', 'Pixel ratio')),
]
if (FRAGMENTS.length + DERIVED.length > 128) throw new Error('compact.ts is out of token slots')

const derivedFragments = (seconds: number, row: Lookup): Fragments =>
  DERIVED.map((derive, i): Fragments[number] => [
    derive(seconds, row),
    String.fromCharCode(LAST_TOKEN - i),
  ]).filter(([fragment]) => fragment !== '')

export const FIELDS = GROUPS.flatMap(([section, labels]) =>
  labels.map((label): [string, string] => [section, label]),
)
const INDEX = new Map(FIELDS.map(([section, label], index) => [`${section}\n${label}`, index]))
// Longest first, so ' Mobile Safari/537.36' is taken whole before ' Safari/537.36' can match.
const TOKENS: Fragments = FRAGMENTS.map((fragment, i): Fragments[number] => [
  fragment,
  String.fromCharCode(FIRST_TOKEN + i),
]).sort((a, b) => b[0].length - a[0].length)

const squeeze = (text: string, derived: Fragments) =>
  [...derived, ...TOKENS].reduce((out, [fragment, token]) => out.split(fragment).join(token), text)

const expand = (text: string, derived: Map<string, string>) =>
  text.replace(PRIVATE_USE, (token) => {
    const fragment = FRAGMENTS[token.charCodeAt(0) - FIRST_TOKEN] ?? derived.get(token)
    if (fragment === undefined) throw new Error(NOT_A_REPORT)
    return fragment
  })

function packValue(value: string | null, derived: Fragments): Value {
  if (value === null) return NULL
  const common = COMMON.indexOf(value)
  if (common !== -1) return common + 1
  return HAS_PRIVATE_USE.test(value) ? [value] : squeeze(value, derived)
}

function unpackValue(packed: unknown, derived: Map<string, string>): string | null {
  if (packed === NULL) return null
  if (typeof packed === 'string') return expand(packed, derived)
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

const rowLookup =
  (rows: [string, Row][]): Lookup =>
  (section, label) =>
    rows.find(([s, [l]]) => s === section && l === label)?.[1][1] ?? null

// A derivation reads its inputs straight from the packed values, so those hold no derived token.
const packedLookup =
  (values: Value[]): Lookup =>
  (section, label) => {
    const packed = values[INDEX.get(`${section}\n${label}`) ?? -1] ?? ABSENT
    return packed === ABSENT ? null : unpackValue(packed, NONE)
  }

export function packReport(report: Report): Packed {
  const rows = rowsOf(report)
  // Whole seconds, rounded down like Date.toString() does, so the local time derives exactly.
  const seconds = Math.floor(Date.parse(report.at) / 1000)
  const derived = derivedFragments(seconds, rowLookup(rows))
  const values: Value[] = FIELDS.map(() => ABSENT)
  const extras: Extra[] = []
  for (const [section, [label, value]] of rows) {
    const index = INDEX.get(`${section}\n${label}`)
    // Rows missing from the table and repeated rows travel verbatim, so nothing is ever lost.
    if (index === undefined || values[index] !== ABSENT) extras.push([section, label, value])
    else values[index] = packValue(value, derived)
  }
  if (import.meta.env?.DEV && extras.length > 0)
    console.warn('Rows sent verbatim; add them to GROUPS in labels.ts:', extras)
  while (values.length > 0 && values[values.length - 1] === ABSENT) values.pop()
  const at = seconds.toString(36)
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
  const seconds = Number.parseInt(at, 36)
  const derived = new Map(
    derivedFragments(seconds, packedLookup(values)).map(([fragment, token]) => [token, fragment]),
  )
  // Sections come out in table order; extra sections follow in the order they were sent.
  const sections = new Map<string, Row[]>(GROUPS.map(([section]) => [section, []]))
  const add = (section: string, row: Row) =>
    sections.set(section, [...(sections.get(section) ?? []), row])
  values.forEach((packed, index) => {
    if (packed !== ABSENT) add(FIELDS[index][0], [FIELDS[index][1], unpackValue(packed, derived)])
  })
  for (const [section, label, value] of extras) add(section, [label, value])
  const summary = sections.get('') ?? []
  sections.delete('')
  return {
    v: 1,
    at: new Date(seconds * 1000).toISOString(),
    note,
    summary,
    sections: [...sections]
      .filter(([, rows]) => rows.length > 0)
      .map(([title, rows]) => ({ title, rows })),
  }
}
