<script lang="ts">
const AUTHOR = 'https://www.jurrejan.com'
const SOURCE = 'https://github.com/doublej/support-details'
</script>

<footer class="credits">
  <p>Made by <a href={AUTHOR}>Jurre-Jan Smit</a></p>
  <p><a href={SOURCE}>Source code on GitHub</a></p>
</footer>

<style>
  .credits {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0 1.5rem;
    padding-top: 0.75rem;
    border-top: 1px dashed var(--rule);
    color: var(--ink-soft);
    font-family: var(--font-mono);
    font-size: 0.8rem;
  }

  p {
    margin: 0;
  }

  /* Padding gives the small footer links a finger-sized tap area. */
  a {
    display: inline-block;
    padding-block: 0.6rem;
    color: var(--ink);
    text-underline-offset: 0.2em;
  }

  a:hover {
    color: var(--carbon);
  }
</style>
