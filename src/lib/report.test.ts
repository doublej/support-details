import { deflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { decodeReport, encodeReport, type Report, reportToText } from './report'

const report: Report = {
  v: 1,
  at: '2026-09-14T12:00:00.000Z',
  note: 'Sam, ticket #42 — ✓ émoji',
  summary: [['Device', 'iPhone']],
  sections: [
    {
      title: 'Browser',
      rows: [
        ['User agent', 'Mozilla/5.0'],
        ['Battery', null],
      ],
    },
  ],
}

const plainPayload = (value: unknown) =>
  `j${Buffer.from(JSON.stringify(value)).toString('base64url')}`

describe('report links', () => {
  it('round-trips through a compact, compressed, URL-safe payload', async () => {
    const payload = await encodeReport(report)
    expect(payload).toMatch(/^c[\w-]+$/)
    expect(await decodeReport(payload)).toEqual(report)
  })

  it('still opens the older self-describing links', async () => {
    const deflated = `z${deflateSync(JSON.stringify(report)).toString('base64url')}`
    expect(await decodeReport(deflated)).toEqual(report)
    expect(await decodeReport(plainPayload(report))).toEqual(report)
  })

  it('rejects unknown formats', async () => {
    await expect(decodeReport('x123')).rejects.toThrow('Not a device report')
  })

  it('rejects links that were cut short', async () => {
    const payload = await encodeReport(report)
    await expect(decodeReport(payload.slice(0, 24))).rejects.toThrow()
  })

  it('rejects payloads that are not reports', async () => {
    const tampered = { ...report, sections: [{ title: 'x', rows: [['label', 42]] }] }
    await expect(decodeReport(plainPayload(tampered))).rejects.toThrow('Not a device report')
    await expect(decodeReport(plainPayload({ ...report, at: 'soon' }))).rejects.toThrow()
  })
})

describe('reportToText', () => {
  it('spells out missing values and appends the link', () => {
    const text = reportToText(report, 'https://example.test/#r=z1')
    expect(text).toContain('Note: Sam, ticket #42')
    expect(text).toContain('Battery: Not available')
    expect(text).toContain('View as a page: https://example.test/#r=z1')
  })

  it('keeps only the glance rows in the brief form', () => {
    const text = reportToText(report, 'https://example.test/', false)
    expect(text).toContain('Device: iPhone')
    expect(text).not.toContain('User agent')
  })
})
