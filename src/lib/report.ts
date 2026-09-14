import { FIRST_TOKEN, packReport, unpackReport } from './link/compact'
import { fromWire, toWire } from './link/wire'

/**
 * A captured device report. Links carry it in the compact format of compact.ts. Change the shape
 * → bump `v` and keep reading v1.
 */
export type Row = [label: string, value: string | null]
export type Section = { title: string; rows: Row[] }
export type Report = { v: 1; at: string; note: string; summary: Row[]; sections: Section[] }

export const HASH_KEY = '#r='
export const NOT_AVAILABLE = 'Not available'

// Payload = format flag + base64url. 'b' is the compact form as wire bytes (wire.ts), deflated;
// 'a' is the same plain, for browsers without CompressionStream (Safari before 16.4). Older links
// are still read, no longer written: 't' / 'u' (compact form as JSON in token bytes, deflated /
// plain), 'c' / 'p' (compact form as JSON in UTF-8) and 'z' / 'j' (self-describing JSON, deflated
// with a zlib header / plain).
const FORMATS: Record<
  string,
  { compression?: CompressionFormat; wire?: boolean; compact?: boolean; tokenBytes?: boolean }
> = {
  b: { compression: 'deflate-raw', wire: true },
  a: { wire: true },
  t: { compression: 'deflate-raw', compact: true, tokenBytes: true },
  u: { compact: true, tokenBytes: true },
  c: { compression: 'deflate-raw', compact: true },
  p: { compact: true },
  z: { compression: 'deflate' },
  j: {},
}

export async function encodeReport(report: Report): Promise<string> {
  const bytes = toWire(packReport(report))
  if (typeof CompressionStream === 'undefined') return `a${toBase64Url(bytes)}`
  return `b${toBase64Url(await transform(bytes, new CompressionStream('deflate-raw')))}`
}

export async function decodeReport(payload: string): Promise<Report> {
  const format = FORMATS[payload[0]]
  if (!format) throw new Error('Not a device report')
  const bytes = fromBase64Url(payload.slice(1))
  const raw = format.compression
    ? await transform(bytes, new DecompressionStream(format.compression))
    : bytes
  if (format.wire) return parseReport(unpackReport(fromWire(raw)))
  const json = format.tokenBytes ? fromTokenBytes(raw) : new TextDecoder().decode(raw)
  const data = JSON.parse(json)
  return parseReport(format.compact ? unpackReport(data) : data)
}

// Token bytes of the 't' / 'u' formats: ASCII as is, a token character (compact.ts, U+E000 up) as
// one byte from 0x80 up; other non-ASCII characters were sent as JSON \u escapes.
const BYTE_TOKEN = 0x80

function fromTokenBytes(bytes: Uint8Array): string {
  let json = ''
  for (const byte of bytes) {
    json += String.fromCharCode(byte < BYTE_TOKEN ? byte : byte - BYTE_TOKEN + FIRST_TOKEN)
  }
  return json
}

export function reportToText(report: Report, link = '', full = true): string {
  const glance: Section = { title: 'At a glance', rows: report.summary }
  const lines = [`Device details, captured ${new Date(report.at).toUTCString()}`]
  if (report.note) lines.push(`Note: ${report.note}`)
  for (const { title, rows } of full ? [glance, ...report.sections] : [glance]) {
    lines.push(
      '',
      title.toUpperCase(),
      ...rows.map(([label, value]) => `${label}: ${value ?? NOT_AVAILABLE}`),
    )
  }
  if (link) lines.push('', `${full ? 'View as a page' : 'All details'}: ${link}`)
  return lines.join('\n')
}

async function transform(
  bytes: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array<ArrayBuffer>> {
  const piped = new Blob([bytes]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(piped).arrayBuffer())
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

const isRows = (rows: unknown): rows is Row[] =>
  Array.isArray(rows) &&
  rows.every(
    (row) =>
      Array.isArray(row) &&
      typeof row[0] === 'string' &&
      (typeof row[1] === 'string' || row[1] === null),
  )

// A shared link is untrusted input: check the whole shape before anything renders it.
// biome-ignore lint/suspicious/noExplicitAny: parsed link JSON, checked field by field below
function parseReport(data: any): Report {
  const sectionsOk =
    Array.isArray(data?.sections) &&
    data.sections.every(
      (section: Section) => typeof section?.title === 'string' && isRows(section.rows),
    )
  const headerOk =
    data?.v === 1 &&
    typeof data.note === 'string' &&
    typeof data.at === 'string' &&
    !Number.isNaN(Date.parse(data.at))
  if (!headerOk || !isRows(data.summary) || !sectionsOk) throw new Error('Not a device report')
  return data
}
