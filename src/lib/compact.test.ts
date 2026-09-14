import { afterEach, describe, expect, it, vi } from 'vitest'
import { type Packed, packReport, unpackReport } from './compact'
import { macReport } from './fixtures'
import { decodeReport, encodeReport, type Report } from './report'

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

afterEach(() => vi.unstubAllGlobals())

describe('compact links', () => {
  it('keeps opening links made by the first compact release', () => {
    expect(unpackReport(FROZEN)).toEqual(macReport)
  })

  it('round-trips a full report in about a third of the old length', async () => {
    const payload = await encodeReport(macReport)
    expect(payload).toMatch(/^c[\w-]+$/)
    expect(payload.length).toBeLessThan(600)
    expect(await decodeReport(payload)).toEqual(macReport)
  })

  it('falls back to plain compact JSON without CompressionStream', async () => {
    vi.stubGlobal('CompressionStream', undefined)
    const payload = await encodeReport(macReport)
    expect(payload).toMatch(/^p[\w-]+$/)
    expect(await decodeReport(payload)).toEqual(macReport)
  })

  it('keeps private-use text in place and sends unknown rows verbatim', () => {
    const report: Report = {
      ...macReport,
      summary: [['Device', '\uF8FF Mac'], ...macReport.summary.slice(1)],
      sections: [...macReport.sections, { title: 'Later', rows: [['New row', 'as sent']] }],
    }
    const packed = packReport(report)
    expect(packed[2][0]).toEqual(['\uF8FF Mac'])
    expect(packed[3]).toEqual([['Later', 'New row', 'as sent']])
    expect(unpackReport(packed)).toEqual(report)
  })

  it('rejects values outside the tables', () => {
    for (const value of [999, 1.5, -2, true, '\uE0FF', [1], ['a', 'b']]) {
      expect(() => unpackReport(['0', '', [value]])).toThrow('Not a device report')
    }
    expect(() => unpackReport(['0', '', [], [['a', 'b', 3]]])).toThrow('Not a device report')
  })
})
