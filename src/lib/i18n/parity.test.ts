import { describe, expect, it } from 'vitest'
import { KEYS, type Key } from '../i18n'
import { ar } from './ar'
import { es } from './es'
import { fr } from './fr'
import { hi } from './hi'
import { zh } from './zh'

const languages: Record<string, Record<Key, string>> = { zh, hi, es, ar, fr }

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
