<script lang="ts">
import { LANG_LABELS, LANG_OPTIONS } from '$lib/i18n'
import { applyLang, type Lang, persistLang, t } from '$lib/lang'

type Props = { lang: Lang; onchange: (lang: Lang) => void }

let { lang, onchange }: Props = $props()

function pick(event: Event) {
  const code = (event.currentTarget as HTMLSelectElement).value
  const next = LANG_OPTIONS.includes(code as Lang) ? (code as Lang) : 'en'
  persistLang(next)
  applyLang(next)
  onchange(next)
}
</script>

<select class="picker" value={lang} aria-label={t(lang, 'Language')} onchange={pick}>
  {#each LANG_OPTIONS as code}
    <option value={code}>{t(lang, LANG_LABELS[code])}</option>
  {/each}
</select>

<style>
  /* Compact footer control: a native select opens the phone's own picker sheet. */
  .picker {
    max-width: 9rem;
    min-height: 2.25rem;
    padding-inline: 0.6rem;
    border: 1.5px solid var(--rule);
    border-radius: 999px;
    background: var(--card);
    color: var(--ink);
    font: 500 0.85rem var(--font-sans);
  }
</style>
