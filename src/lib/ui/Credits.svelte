<script lang="ts">
import { type Lang, t } from '$lib/i18n'

const AUTHOR = 'https://www.jurrejan.com'

let { lang }: { lang: Lang } = $props()
</script>

<footer class="credits">
  <span>{t(lang, 'Made by')} <a href={AUTHOR}>Jurre-Jan Smit</a></span>
</footer>

<style>
  .credits {
    width: min(100%, 44rem);
    margin-inline: auto;
    color: var(--ink-soft);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }

  /* At least 24px tall: the WCAG 2.2 minimum target size, inside a compact strip. */
  a {
    display: inline-block;
    min-height: 1.5rem;
    padding-block: 0.2rem;
    color: var(--ink);
    text-underline-offset: 0.2em;
  }

  a:hover {
    color: var(--carbon);
  }
</style>
