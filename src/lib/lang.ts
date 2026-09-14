import { DICTS, type Key, type Lang } from './i18n'

export type { Key, Lang }

/** Base subtag we can render, or null. Pure. */
export function langFromTag(tag: string): Lang | null {
  const base = tag.split('-')[0]?.toLowerCase()
  if (base === 'en') return 'en'
  if (
    base === 'zh' ||
    base === 'hi' ||
    base === 'es' ||
    base === 'ar' ||
    base === 'fr' ||
    base === 'nl'
  ) {
    return base
  }
  return null
}

/** First recognized navigator language, else English. Respects the order, 'en' included. */
export function pickLanguage(tags: readonly string[] | undefined): Lang {
  for (const tag of tags ?? []) {
    const lang = langFromTag(tag)
    if (lang) return lang
  }
  return 'en'
}

/** Browser-only: the page is prerendered, so navigator may not exist. Defaults to English. */
export function currentLang(): Lang {
  if (typeof navigator === 'undefined') return 'en'
  return pickLanguage(navigator.languages ?? [navigator.language])
}

/** Manual ?lang= override from a query string. Pure: missing and unknown values give null. */
export function langFromQuery(search: string): Lang | null {
  const value = new URLSearchParams(search).get('lang')
  return value ? langFromTag(value.trim()) : null
}

const STORED_LANG_KEY = 'support-details-lang'

function readStoredLang(): Lang | null {
  try {
    return langFromTag(localStorage.getItem(STORED_LANG_KEY) ?? '')
  } catch {
    return null
  }
}

/** Remember a manually chosen language. Browser-only. */
export function persistLang(lang: Lang): void {
  try {
    localStorage.setItem(STORED_LANG_KEY, lang)
  } catch {
    // Blocked storage: the page still works, the choice just won't stick.
  }
}

/**
 * Manual ?lang= wins and is remembered; then the stored choice, then the browser list. The
 * query is stripped (keeping the report hash) so shared links stay language-neutral.
 * Browser-only: call it on mount.
 */
export function resolveLang(): Lang {
  const override = typeof location === 'undefined' ? null : langFromQuery(location.search)
  if (override) {
    persistLang(override)
    history.replaceState(null, '', location.pathname + location.hash)
    return override
  }
  return readStoredLang() ?? currentLang()
}

/** Translate a key; unknown keys (free-text values, crafted labels) pass through. */
export function t(lang: Lang, key: string): string {
  if (lang === 'en') return key
  return DICTS[lang][key as Key] ?? key
}

/** Fill {placeholders} in a translated template. */
export function fill(template: string, vars: Record<string, string>): string {
  let out = template
  for (const [name, value] of Object.entries(vars)) out = out.split(`{${name}}`).join(value)
  return out
}

/** Split a translated template around one {placeholder} so markup can wrap the value. */
export function parts(template: string, name: string): [before: string, after: string] {
  const marker = `{${name}}`
  const at = template.indexOf(marker)
  return at < 0 ? [template, ''] : [template.slice(0, at), template.slice(at + marker.length)]
}

/** Set the page language; only Arabic flips the direction. Browser-only. */
export function applyLang(lang: Lang): void {
  const root = document.documentElement
  root.lang = lang
  if (lang === 'ar') root.dir = 'rtl'
  else root.removeAttribute('dir')
}
