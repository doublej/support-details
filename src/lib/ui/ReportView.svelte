<script lang="ts">
import type { Snippet } from 'svelte'
import { NOT_AVAILABLE, type Report } from '$lib/report'

type Props = {
  report: Report
  oncopy: (label: string, value: string) => void
  /** Rendered between the glance card and the full list. */
  children?: Snippet
}

let { report, oncopy, children }: Props = $props()

// A zero-width space after each "/" lets "Europe/Amsterdam" wrap at the slash, not mid-word.
const wrapAtSlashes = (text: string) => text.split('/').join('/​')
</script>

<section class="glance rise" aria-labelledby="glance-title">
  <h2 id="glance-title" class="eyebrow">At a glance</h2>
  <dl>
    {#each report.summary as [label, value]}
      <div class="glance-row">
        <dt>{label}</dt>
        <dd class:missing={value === null}>{value === null ? NOT_AVAILABLE : wrapAtSlashes(value)}</dd>
      </div>
    {/each}
  </dl>
</section>

{@render children?.()}

<!-- Never key these loops by label: a crafted link can repeat labels, and duplicate keys throw. -->
<section class="details" aria-labelledby="details-title">
  <header class="rise" style:--i={2}>
    <h2 id="details-title">All details</h2>
    <p id="copy-hint">Tap a line to copy it.</p>
  </header>
  {#each report.sections as section, index}
    <details class="section rise" style:--i={index + 3} open>
      <summary>
        <span>{section.title}</span>
        <span class="count">{section.rows.length}<span class="visually-hidden"> lines</span></span>
      </summary>
      <ul>
        {#each section.rows as [label, value]}
          <li>
            <button
              type="button"
              class="row"
              aria-describedby="copy-hint"
              onclick={() => oncopy(label, value ?? NOT_AVAILABLE)}
            >
              <span class="label">{label}</span>
              <span class="value" class:missing={value === null}>{value ?? NOT_AVAILABLE}</span>
            </button>
          </li>
        {/each}
      </ul>
    </details>
  {/each}
</section>

<style>
  .glance {
    position: relative;
    padding: 1.25rem 1.25rem 1.75rem;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
  }

  /* Perforated tear-off edge, punched in the page colour. */
  .glance::after {
    content: '';
    position: absolute;
    inset: auto 0 -6px;
    height: 12px;
    background: radial-gradient(circle at 8px 6px, var(--paper) 5px, transparent 5.5px) 0 0 / 16px
      12px repeat-x;
  }

  dl {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: 1rem 1.25rem;
    margin: 0.9rem 0 0;
  }

  .glance-row:first-child {
    grid-column: 1 / -1;
  }

  dt {
    color: var(--ink-soft);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  dd {
    margin: 0.1rem 0 0;
    font-size: 1.3rem;
    font-weight: 650;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }

  .glance-row:first-child dd {
    font-size: clamp(2rem, 9vw, 2.75rem);
    font-weight: 750;
    letter-spacing: -0.02em;
  }

  .details {
    display: grid;
    gap: 0.25rem;
  }

  .details header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.25rem 1rem;
    margin-bottom: 0.5rem;
  }

  .details header p {
    margin: 0;
    color: var(--ink-soft);
    font-size: 0.95rem;
  }

  .section {
    border-top: 1.5px solid var(--ink);
  }

  summary {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 3.25rem;
    font-size: 1.15rem;
    font-weight: 650;
    list-style: none;
    cursor: pointer;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::after {
    content: '';
    width: 0.55rem;
    height: 0.55rem;
    margin-left: auto;
    border-right: 2px solid currentcolor;
    border-bottom: 2px solid currentcolor;
    transform: translateY(-25%) rotate(45deg);
    transition: transform 0.2s var(--ease);
  }

  details[open] > summary::after {
    transform: translateY(25%) rotate(-135deg);
  }

  .count {
    color: var(--ink-faint);
    font-family: var(--font-mono);
    font-size: 0.8rem;
    font-weight: 400;
  }

  ul {
    margin: 0 0 1rem;
    padding: 0;
    list-style: none;
  }

  .row {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    gap: 0.25rem 1rem;
    width: 100%;
    min-height: 2.75rem;
    padding: 0.65rem 0.25rem;
    border: 0;
    border-bottom: 1px dashed var(--rule);
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: copy;
  }

  .row:active {
    background: var(--carbon-wash);
  }

  .label {
    color: var(--ink-soft);
    font-size: 0.95rem;
  }

  .value {
    color: var(--carbon);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    overflow-wrap: anywhere;
  }

  .missing {
    color: var(--ink-faint);
  }

  @media (hover: hover) {
    .row:hover .value {
      text-decoration: underline dotted;
      text-underline-offset: 0.2em;
    }
  }
</style>
