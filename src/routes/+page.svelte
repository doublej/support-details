<script lang="ts">
import { onMount } from 'svelte'
import { copyText, shareLink } from '$lib/clipboard'
import { collectReport } from '$lib/collect'
import { decodeReport, encodeReport, HASH_KEY, type Report, reportToText } from '$lib/report'
import ReportView from '$lib/ui/ReportView.svelte'
import SendPanel from '$lib/ui/SendPanel.svelte'

const LINK_COPIED = 'Link copied. Paste it into your chat or email.'
const TEXT_COPIED = 'All details copied as text.'

let mode = $state<'loading' | 'own' | 'shared' | 'broken'>('loading')
let report = $state.raw<Report | null>(null)
let note = $state('')
let link = $state('')
let toast = $state('')
let toastTimer: ReturnType<typeof setTimeout> | undefined

const outgoing = $derived(report && mode === 'own' ? { ...report, note: note.trim() } : report)
const fullText = $derived(outgoing ? reportToText(outgoing, link) : '')
const mailto = $derived(
  outgoing
    ? `mailto:?subject=${encodeURIComponent('My device details')}&body=${encodeURIComponent(reportToText(outgoing, link, false))}`
    : '',
)
const capturedAt = $derived(
  report
    ? new Date(report.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '',
)

async function load() {
  const payload = location.hash.startsWith(HASH_KEY) ? location.hash.slice(HASH_KEY.length) : ''
  link = ''
  if (!payload) {
    report = await collectReport()
    mode = 'own'
    return
  }
  // Chat apps sometimes cut long links short, so a link that won't decode is an expected state.
  report = await decodeReport(payload).catch(() => null)
  mode = report ? 'shared' : 'broken'
  link = location.href
}

onMount(() => {
  load()
  window.addEventListener('hashchange', load)
  return () => window.removeEventListener('hashchange', load)
})

// Precompute the link: the share sheet must open inside the tap, with no await before it.
$effect(() => {
  const draft = outgoing
  if (mode !== 'own' || !draft) return
  encodeReport(draft).then((payload) => {
    if (draft === outgoing) link = `${location.origin}/${HASH_KEY}${payload}`
  })
})

function flash(message: string) {
  toast = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast = ''
  }, 2600)
}

const blocked = () => flash('This browser blocked copying. Select the text and copy it yourself.')

function copy(text: string, message: string) {
  copyText(text).then(() => flash(message), blocked)
}

function share() {
  shareLink(link, 'My device details').then((result) => {
    if (result === 'copied') flash(LINK_COPIED)
  }, blocked)
}

const copyRow = (label: string, value: string) => copy(`${label}: ${value}`, `Copied “${label}”.`)
</script>

<svelte:head>
  <title>{mode === 'shared' ? 'Device details someone sent you' : 'Device details for support'}</title>
</svelte:head>

<main class="page">
  <header class="masthead rise">
    <a class="brand" href="/" data-sveltekit-reload>support<span>·</span>details</a>
    {#if mode === 'shared'}<span class="stamp">Received</span>{/if}
  </header>

  {#if mode === 'loading'}
    <section class="rise" style:--i={1}>
      <h1>Reading your device…</h1>
      <noscript>
        <p class="lede">
          This page needs JavaScript to read your device. Turn it on in your browser settings, then
          reload.
        </p>
      </noscript>
    </section>
  {:else if mode === 'broken'}
    <section class="stack rise" style:--i={1}>
      <h1>This link didn’t open.</h1>
      <p class="lede">
        Part of it was probably cut off when it was sent, or this browser is too old to read it. Ask
        the sender to tap <strong>Copy link</strong> and send it again.
      </p>
      <a class="button primary" href="/" data-sveltekit-reload>Check this device instead</a>
    </section>
  {:else if report && mode === 'own'}
    <section class="rise" style:--i={1}>
      <h1>Your device details, ready to send.</h1>
      <p class="lede">
        Someone helping you needs to know which phone, browser and screen you use. It is all on this
        page. Tap <strong>Share link</strong> to send it to them.
      </p>
    </section>

    <ReportView {report} oncopy={copyRow}>
      <SendPanel bind:note {link} {mailto} oncopytext={() => copy(fullText, TEXT_COPIED)} />
    </ReportView>
  {:else if report && mode === 'shared'}
    <section class="rise" style:--i={1}>
      <h1>Device details someone sent you.</h1>
      <p class="lede">
        Captured {capturedAt}, your time. Everything below describes the sender’s device, not the one
        you are using now.
      </p>
      {#if report.note}
        <blockquote class="note">
          <span class="eyebrow">Note from the sender</span>
          {report.note}
        </blockquote>
      {/if}
    </section>

    <ReportView {report} oncopy={copyRow}>
      <div class="actions rise" style:--i={1}>
        <button
          class="button"
          type="button"
          onclick={() => copy(JSON.stringify(report, null, 2), 'Copied as JSON.')}
        >
          Copy as JSON
        </button>
        <button class="button" type="button" onclick={() => copy(link, 'Link copied.')}>
          Copy link
        </button>
      </div>
    </ReportView>
  {/if}
</main>

{#if mode === 'own' || mode === 'shared'}
  <nav class="dock" aria-label="Send">
    <div class="actions">
      {#if mode === 'own'}
        <button class="button primary" type="button" onclick={share} disabled={!link}>
          Share link
        </button>
        <button class="button" type="button" onclick={() => copy(link, LINK_COPIED)} disabled={!link}>
          Copy link
        </button>
      {:else}
        <button class="button primary" type="button" onclick={() => copy(fullText, TEXT_COPIED)}>
          Copy as text
        </button>
        <a class="button" href="/" data-sveltekit-reload>Check my device</a>
      {/if}
    </div>
  </nav>
{/if}

<p class="toast" class:visible={Boolean(toast)} role="status">{toast}</p>

<style>
  .page {
    display: grid;
    gap: 1.75rem;
    width: min(100% - 2.5rem, 44rem);
    margin-inline: auto;
    padding-block: max(1.25rem, env(safe-area-inset-top)) calc(8rem + env(safe-area-inset-bottom));
  }

  .masthead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 2.5rem;
  }

  .brand {
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 0.9rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-decoration: none;
  }

  .brand span {
    color: var(--carbon);
  }

  .stamp {
    padding: 0.3rem 0.6rem;
    border: 2px solid currentcolor;
    border-radius: 6px;
    color: var(--stamp);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    transform: rotate(-4deg);
  }

  @media (prefers-reduced-motion: no-preference) {
    .stamp {
      animation: thunk 0.45s var(--ease) 0.35s both;
    }
  }

  @keyframes thunk {
    from {
      opacity: 0;
      transform: rotate(-14deg) scale(1.9);
    }
  }

  .stack {
    display: grid;
    justify-items: start;
    gap: 1.25rem;
  }

  .note {
    margin: 1.25rem 0 0;
    padding: 0.9rem 1.1rem;
    border-left: 4px solid var(--carbon);
    border-radius: 0 12px 12px 0;
    background: var(--card);
    font-size: 1.15rem;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .note .eyebrow {
    display: block;
    margin-bottom: 0.25rem;
  }

  .dock {
    position: fixed;
    inset: auto 0 0;
    z-index: 10;
    padding: 0.75rem max(1.25rem, env(safe-area-inset-right))
      calc(0.75rem + env(safe-area-inset-bottom)) max(1.25rem, env(safe-area-inset-left));
    border-top: 1px solid var(--rule);
    background: var(--paper-glass);
    -webkit-backdrop-filter: blur(14px);
    backdrop-filter: blur(14px);
  }

  .dock .actions {
    grid-template-columns: 1fr 1fr;
    width: min(100%, 44rem);
    margin-inline: auto;
  }

  .toast {
    position: fixed;
    bottom: calc(5.75rem + env(safe-area-inset-bottom));
    left: 50%;
    z-index: 20;
    width: max-content;
    max-width: calc(100% - 2.5rem);
    padding: 0.7rem 1rem;
    border-radius: 12px;
    background: var(--ink);
    color: var(--paper);
    font-size: 0.95rem;
    opacity: 0;
    pointer-events: none;
    transform: translate(-50%, 0.75rem);
    transition:
      opacity 0.2s,
      transform 0.25s var(--ease);
  }

  .toast.visible {
    opacity: 1;
    transform: translate(-50%, 0);
  }
</style>
