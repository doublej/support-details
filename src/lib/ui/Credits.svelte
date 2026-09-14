<script lang="ts">
const AUTHOR = 'https://www.jurrejan.com'
const SOURCE = 'https://github.com/doublej/support-details'
</script>

<footer class="credits">
  <span>Made by <a href={AUTHOR}>Jurre-Jan Smit</a></span>
  <a href={SOURCE}>Source on GitHub</a>
</footer>

<style>
  .credits {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0 1rem;
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
