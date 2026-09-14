<script lang="ts">
import { encode } from 'uqr'
import { type Lang, t } from '$lib/lang'

type Props = { url: string; title: string; body: string; lang: Lang }

let { url, title, body, lang }: Props = $props()

const QUIET = 4

// One SVG path of unit squares keeps the DOM small and the code crisp at any size.
const qr = $derived(encode(url, { ecc: 'L', border: 0 }))
const path = $derived(
  qr.data.flatMap((row, y) => row.map((dark, x) => (dark ? `M${x} ${y}h1v1h-1z` : ''))).join(''),
)
// Whole CSS pixels per module, at least 3: fractional modules blur, and a full report link
// (about 125 modules) stops scanning on a 1x screen when squeezed into 16rem.
const side = $derived(qr.size + QUIET * 2)
const width = $derived(side * Math.max(3, Math.ceil(256 / side)))
</script>

<!-- Desktop only: on a phone there is nothing to scan it with. -->
<section class="phone rise" style:--i={1} aria-labelledby="phone-title">
  <!-- Always dark on white, with a quiet zone: some phone cameras miss inverted codes. -->
  <svg
    viewBox="{-QUIET} {-QUIET} {side} {side}"
    style:width="{width}px"
    role="img"
    aria-label={t(lang, 'QR code that opens this page on a phone')}
    shape-rendering="crispEdges"
  >
    <rect x={-QUIET} y={-QUIET} width={side} height={side} fill="#fff" />
    <path d={path} fill="#1c1b17" />
  </svg>
  <div>
    <h2 id="phone-title">{title}</h2>
    <p>{body}</p>
  </div>
</section>

<style>
  .phone {
    display: none;
  }

  @media (min-width: 48rem) {
    .phone {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 1.75rem;
      padding: 1.5rem;
      border-radius: var(--radius);
      background: var(--card);
      box-shadow: var(--shadow);
    }
  }

  svg {
    display: block;
    max-width: 100%;
    height: auto;
    border-radius: 10px;
  }

  p {
    margin: 0.6rem 0 0;
    color: var(--ink-soft);
  }
</style>
