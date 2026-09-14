import { describe, expect, it } from 'vitest'
import { KEYS, type Key, langFromQuery, langFromTag, pickLanguage } from './i18n'
import { ar } from './i18n/ar'
import { es } from './i18n/es'
import { fr } from './i18n/fr'
import { hi } from './i18n/hi'
import { nl } from './i18n/nl'
import { zh } from './i18n/zh'

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
