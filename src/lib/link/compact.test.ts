import { deflateRawSync, inflateRawSync } from 'node:zlib'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { macReport, tokenLink } from '../fixtures'
import { decodeReport, encodeReport, type Report, type Row } from '../report'
import { type Packed, packReport, unpackReport } from './compact'
import { fromWire, toWire } from './wire'

// macReport packed exactly as the first compact release wrote it. If this test fails, a list in
// compact.ts was reordered, shortened or reworded, and links people already sent now show wrong
// details. Fix compact.ts; never edit this literal.
const FROZEN: Packed = [
  'tlcsgj',
  'Sam, ticket #42',
  [
    'Mac',
    'macOS 26.6',
    'Chrome 152.0.0.0',
    '1512\uE022982 at 2×',
    '\uE01DAmsterdam',
    'MacIntel',
    'arm, 64-bit',
    '10',
    '\uE02116 GB',
    '100%, charging',
    2,
    15,
    1,
    '\uE000\uE005\uE001152.0.0.0\uE003',
    '\uE00C152.0.7977.84, \uE00D152.0.7977.84',
    8,
    0,
    0,
    1,
    2,
    '1512\uE022982',
    '3024\uE0221964',
    '2',
    '1512\uE022859',
    10,
    13,
    23,
    21,
    1,
    2,
    11,
    2,
    2,
    2,
    2,
    0,
    4,
    4,
    4,
    1,
    1,
    '\uE014\uE015\uE016\uE017\uE018',
    '\uE00FApple, \uE010Apple M1 Pro\uE011',
    '\uE013Apple)',
    1,
    -1,
    1,
    1,
    7,
    '10.7 GB',
    1,
    16,
    1,
    1,
    1,
    1,
    0,
    'Good, 10+\uE01F50\uE020',
    2,
    '\uE01DAmsterdam',
    'UTC+02:00',
    'Mon Sep 14 2026 14:09:55\uE019+0200 (Central European\uE01B',
    9,
    'en-GB, en-US, en',
    'en-GB',
    '1,234,567.89',
    17,
    19,
  ],
]

const withLocalTime = (value: string): Report => ({
  ...macReport,
  sections: macReport.sections.map((section) => ({
    ...section,
    rows: section.rows.map((row): Row => (row[0] === 'Local time' ? ['Local time', value] : row)),
  })),
})

afterEach(() => vi.unstubAllGlobals())

describe('compact links', () => {
  it('keeps opening links made by the first compact release', () => {
    expect(unpackReport(FROZEN)).toEqual(macReport)
  })

  it('still opens links with three-byte tokens', async () => {
    const json = JSON.stringify(FROZEN)
    const deflated = `c${deflateRawSync(json).toString('base64url')}`
    expect(await decodeReport(deflated)).toEqual(macReport)
    expect(await decodeReport(`p${Buffer.from(json).toString('base64url')}`)).toEqual(macReport)
  })

  it('still opens links with JSON in token bytes', async () => {
    expect(await decodeReport(tokenLink)).toEqual(macReport)
    const plain = inflateRawSync(Buffer.from(tokenLink.slice(1), 'base64url'))
    expect(await decodeReport(`u${plain.toString('base64url')}`)).toEqual(macReport)
  })

  it('round-trips a full report in about a seventh of a JSON link', async () => {
    const payload = await encodeReport(macReport)
    expect(payload).toMatch(/^b[\w-]+$/)
    expect(payload.length).toBeLessThan(260)
    expect(await decodeReport(payload)).toEqual(macReport)
  })

  it('falls back to plain wire bytes without CompressionStream', async () => {
    vi.stubGlobal('CompressionStream', undefined)
    const payload = await encodeReport(macReport)
    expect(payload).toMatch(/^a[\w-]+$/)
    expect(payload.length).toBeLessThan(300)
    expect(await decodeReport(payload)).toEqual(macReport)
  })

  it('sends rows other rows determine as one token each', () => {
    const [, , values] = packReport(macReport)
    expect(values[3]).toBe('\uE07F') // At a glance → Screen: size at ratio
    expect(values[21]).toBe('\uE07D') // Screen in device pixels
    expect(values[61]).toMatch(/^\uE07E \(/) // Local time: date and offset, then the zone name
  })

  it('sends a derived row as text when it does not match', () => {
    const report = withLocalTime('Mon Sep 14 2026 14:09:56 GMT+0200 (Central European Summer Time)')
    const packed = packReport(report)
    expect(packed[2][61]).toMatch(/^Mon Sep 14 2026 14:09:56/)
    expect(unpackReport(packed)).toEqual(report)
  })

  it('rejects a derived token whose inputs are missing', () => {
    expect(() => unpackReport(['0', '', ['\uE07F']])).toThrow('Not a device report')
  })

  it('keeps private-use text in place and sends unknown rows verbatim', async () => {
    const report: Report = {
      ...macReport,
      summary: [['Device', '\uF8FF Mac'], ...macReport.summary.slice(1)],
      sections: [...macReport.sections, { title: 'Later', rows: [['New row', 'as sent']] }],
    }
    const packed = packReport(report)
    expect(packed[2][0]).toEqual(['\uF8FF Mac'])
    expect(packed[3]).toEqual([['Later', 'New row', 'as sent']])
    expect(unpackReport(packed)).toEqual(report)
    expect(await decodeReport(await encodeReport(report))).toEqual(report)
  })

  it('rejects values outside the tables', () => {
    for (const value of [999, 1.5, -2, true, '\uE0FF', [1], ['a', 'b']]) {
      expect(() => unpackReport(['0', '', [value]])).toThrow('Not a device report')
    }
    expect(() => unpackReport(['0', '', [], [['a', 'b', 3]]])).toThrow('Not a device report')
  })
})

describe('wire bytes', () => {
  const [esc, token, privateUse] = [27, 0xe000, 0xf8ff].map((code) => String.fromCharCode(code))
  const packed: Packed = [
    'tlcsgj',
    `Sam ${esc} ✓ 👋 ${token}${privateUse}`,
    ['x'.repeat(200), 'short', 5, -1, 0, [`${token}${privateUse}`], token],
    [
      ['Later', 'New row', null],
      ['Later', 'Other', 'as sent'],
    ],
  ]

  it('round-trips every kind of value', () => {
    expect(fromWire(toWire(packed))).toEqual(packed)
    expect(fromWire(toWire(['0', '', []]))).toEqual(['0', '', []])
  })

  it('rejects bytes cut short or left over', () => {
    const bytes = toWire(packed)
    expect(() => fromWire(bytes.subarray(0, bytes.length - 1))).toThrow('Not a device report')
    expect(() => fromWire(new Uint8Array([...bytes, 0]))).toThrow('Not a device report')
  })
})
