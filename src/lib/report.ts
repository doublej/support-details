/**
 * A captured device report. Labels travel with their values, so a link made by an older build
 * still renders after the collectors change. Change the shape → bump `v` and keep reading v1.
 */
export type Row = [label: string, value: string | null]
export type Section = { title: string; rows: Row[] }
export type Report = { v: 1; at: string; note: string; summary: Row[]; sections: Section[] }

export const HASH_KEY = '#r='
export const NOT_AVAILABLE = 'Not available'

// Payload = format flag + base64url. 'z' is deflated JSON; 'j' is plain JSON for browsers
// without CompressionStream (Safari before 16.4), whose links are just longer.
export async function encodeReport(report: Report): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(report))
  if (typeof CompressionStream === 'undefined') return `j${toBase64Url(json)}`
  return `z${toBase64Url(await transform(json, new CompressionStream('deflate')))}`
}

export async function decodeReport(payload: string): Promise<Report> {
  const bytes = fromBase64Url(payload.slice(1))
  const json =
    payload[0] === 'z' ? await transform(bytes, new DecompressionStream('deflate')) : bytes
  return parseReport(new TextDecoder().decode(json))
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
function parseReport(text: string): Report {
  const data = JSON.parse(text)
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
