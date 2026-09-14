<script lang="ts">
import type { Snippet } from 'svelte'
import { fill, type Lang, t } from '$lib/i18n'
import { NOT_AVAILABLE, type Report } from '$lib/report'

type Props = {
  report: Report
  oncopy: (label: string, value: string) => void
  lang: Lang
  /** Rendered between the glance card and the full list. */
  children?: Snippet
}

let { report, oncopy, lang, children }: Props = $props()

const tr = (key: string): string => t(lang, key)

// A zero-width space after each "/" lets "Europe/Amsterdam" wrap at the slash, not mid-word.
const wrapAtSlashes = (text: string) => text.split('/').join('/​')
</script>

<section class="glance rise" aria-labelledby="glance-title">
  <h2 id="glance-title" class="eyebrow">{tr('At a glance')}</h2>
  <dl>
    {#each report.summary as [label, value]}
      <div class="glance-row">
        <dt>{tr(label)}</dt>
        <dd class:missing={value === null}>
          <bdi>{value === null ? tr(NOT_AVAILABLE) : wrapAtSlashes(tr(value))}</bdi>
        </dd>
      </div>
    {/each}
  </dl>
</section>

{@render children?.()}

<!-- Never key these loops by label: a crafted link can repeat labels, and duplicate keys throw. -->
<section class="details" aria-labelledby="details-title">
  <header class="rise" style:--i={2}>
    <h2 id="details-title">{tr('All details')}</h2>
    <p id="copy-hint">{tr('Tap a line to copy it.')}</p>
  </header>
  {#each report.sections as section, index}
    {@const found = section.rows.filter(([, value]) => value !== null)}
    {@const missing = section.rows.filter(([, value]) => value === null).map(([label]) => label)}
    <details class="section rise" style:--i={index + 3} open>
      <summary>
        <span>{tr(section.title)}</span>
        <span class="count"
          >{section.rows.length}<span class="visually-hidden">{' '}{tr('lines')}</span></span
        >
      </summary>
      <ul>
        {#each found as [label, value]}
          <li>
            <button
              type="button"
              class="row"
              aria-describedby="copy-hint"
              onclick={() => oncopy(tr(label), tr(value ?? NOT_AVAILABLE))}
            >
              <span class="label">{tr(label)}</span>
              <span class="value"><bdi>{tr(value ?? NOT_AVAILABLE)}</bdi></span>
            </button>
          </li>
        {/each}
      </ul>
      <!-- One quiet line instead of a column of "Not available": on iPhone that is a third of the rows. -->
      {#if missing.length > 0}
        <p class="missing-note">
          {fill(tr('Not available in this browser: {labels}.'), {
            labels: missing.map((label) => tr(label)).join(', '),
          })}
        </p>
      {/if}
    </details>
  {/each}
</section>

<style>
  .missing-note {
    margin: -0.5rem 0 1rem;
    color: var(--ink-faint);
    font-size: 0.85rem;
  }

  /* drop-shadow follows the notched outline below; box-shadow would stay a rectangle under the holes. */
  .glance {
    position: relative;
    isolation: isolate;
    padding: 1.25rem 1.25rem 1.75rem;
    filter: drop-shadow(0 1px 0 rgb(28 27 23 / 6%)) drop-shadow(0 12px 14px rgb(28 27 23 / 14%));
  }

  @media (prefers-color-scheme: dark) {
    .glance {
      filter: drop-shadow(0 1px 0 rgb(0 0 0 / 30%)) drop-shadow(0 14px 18px rgb(0 0 0 / 45%));
    }
  }

  /* The ticket: a body mask plus an SVG tile of half-round notches along the torn bottom edge. The
     notches are real holes, so the page and the shadow show through. Tiles round to whole notches.
     The body overlaps the tile by 1px so no seam shows. Browsers without mask get a plain card. */
  .glance::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: var(--radius) var(--radius) 0 0;
    background: var(--card);
    mask:
      linear-gradient(#000 0 0) top / 100% calc(100% - 7px) no-repeat,
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='8'%3E%3Cpath d='M0 0h16v8h-3a5 5 0 0 0-10 0H0z'/%3E%3C/svg%3E")
        bottom / 16px 8px round no-repeat;
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
    margin-inline-start: auto;
    border-inline-end: 2px solid currentcolor;
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
    text-align: start;
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
