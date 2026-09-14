import { deflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { legacyLink } from './fixtures'
import { KEYS, type Key } from './i18n'
import { ar } from './i18n/ar'
import { es } from './i18n/es'
import { fr } from './i18n/fr'
import { hi } from './i18n/hi'
import { nl } from './i18n/nl'
import { zh } from './i18n/zh'
import { langFromQuery, langFromTag, pickLanguage } from './lang'
import { decodeReport, encodeReport, HASH_PREFIX, type Report, reportToText } from './report'

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
  // People have already sent links in this format. Never make this test pass by editing the link.
  it('opens a real link written by the release before compact links', async () => {
    const legacy = await decodeReport(legacyLink)
    expect(legacy.at).toBe('2026-09-14T14:30:35.550Z')
    expect(legacy.summary[0]).toEqual(['Device', 'Mac'])
    expect(legacy.sections.map(({ title }) => title)).toEqual([
      'Device',
      'Browser',
      'Screen',
      'Appearance & accessibility',
      'Permissions & media',
      'Browser features',
      'Network',
      'Language & time',
    ])
    expect(legacy.sections[1].rows[2]).toEqual(['Cookies', 'Working'])
  })

  it('round-trips through a compact, coded, URL-safe payload', async () => {
    const payload = await encodeReport(report)
    expect(payload).toMatch(/^e[\w-]+$/)
    expect(await decodeReport(payload)).toEqual(report)
  })

  it('reads a payload after either hash prefix', () => {
    expect('#r=e123'.replace(HASH_PREFIX, '')).toBe('e123')
    expect('#e123'.replace(HASH_PREFIX, '')).toBe('e123')
    expect(''.replace(HASH_PREFIX, '')).toBe('')
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

const languages: Record<string, Record<Key, string>> = { zh, hi, es, ar, fr, nl }

const placeholders = (text: string): string[] =>
  [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()

describe('i18n parity', () => {
  for (const [name, dict] of Object.entries(languages)) {
    it(`${name} has exactly the English keys`, () => {
      expect(Object.keys(dict).sort()).toEqual([...KEYS].sort())
    })
    it(`${name} has no empty translations`, () => {
      for (const key of KEYS) expect(dict[key].length).toBeGreaterThan(0)
    })
    it(`${name} keeps every {placeholder} of its key`, () => {
      for (const key of KEYS) expect(placeholders(dict[key])).toEqual(placeholders(key))
    })
  }
})

describe('language decision', () => {
  it('reads the base subtag, case-insensitively', () => {
    expect(langFromTag('zh-CN')).toBe('zh')
    expect(langFromTag('AR')).toBe('ar')
    expect(langFromTag('en')).toBe('en')
    expect(langFromTag('de')).toBe(null)
    expect(langFromTag('')).toBe(null)
  })

  it('takes the first recognized navigator language, English included', () => {
    expect(pickLanguage(['fr-FR', 'en'])).toBe('fr')
    expect(pickLanguage(['en', 'fr'])).toBe('en')
    expect(pickLanguage(['de', 'es'])).toBe('es')
    expect(pickLanguage(['nl-NL'])).toBe('nl')
    expect(pickLanguage([])).toBe('en')
    expect(pickLanguage(undefined)).toBe('en')
  })

  it('reads the ?lang= override and ignores unknown values', () => {
    expect(langFromQuery('?lang=hi')).toBe('hi')
    expect(langFromQuery('?lang=es-MX')).toBe('es')
    expect(langFromQuery('?lang=de')).toBe(null)
    expect(langFromQuery('')).toBe(null)
  })
})
