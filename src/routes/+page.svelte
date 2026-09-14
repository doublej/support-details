<script lang="ts">
import { onMount } from 'svelte'
import { copyText, shareLink } from '$lib/clipboard'
import { collectReport } from '$lib/device/collect'
import { decodeReport, encodeReport, HASH_KEY, type Report, reportToText } from '$lib/report'
import Credits from '$lib/ui/Credits.svelte'
import PhoneQr from '$lib/ui/PhoneQr.svelte'
import ReportView from '$lib/ui/ReportView.svelte'
import SendPanel from '$lib/ui/SendPanel.svelte'

const LINK_COPIED = 'Link copied. Paste it into your chat or email.'
const TEXT_COPIED = 'All details copied as text.'

let mode = $state<'loading' | 'own' | 'shared' | 'broken'>('loading')
let report = $state.raw<Report | null>(null)
let note = $state('')
let link = $state('')
let home = $state('')
let tooOld = $state(false)
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
  link = location.href
  // Safari before 16.4 cannot unpack compressed links at all; a resend would fail the same way.
  tooOld = !report && typeof DecompressionStream === 'undefined'
  mode = report ? 'shared' : 'broken'
}

onMount(() => {
  // The app runs, so the ES5 fallback for very old browsers in app.html can go.
  document.getElementById('fallback')?.remove()
  home = `${location.origin}/`
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
      {#if tooOld}
        <h1>This browser can’t open the link.</h1>
        <p class="lede">
          It is too old to unpack the details. Open the link on a computer or a newer phone, or ask
          the sender to use <strong>Copy as text</strong> and send that instead.
        </p>
      {:else}
        <h1>This link didn’t open.</h1>
        <p class="lede">
          Part of it was probably cut off when it was sent. Ask the sender to tap
          <strong>Copy link</strong> and send it again.
        </p>
      {/if}
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

    <PhoneQr
      url={home}
      title="Need the details of your phone instead?"
      body="Point your phone’s camera at this code. The page opens on the phone and reads that phone."
    />

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

    <PhoneQr
      url={link}
      title="Open this report on your phone"
      body="Point your phone’s camera at this code to take these details with you."
    />

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

<!-- Fixed to the bottom of the viewport: actions (primary on the right, under the thumb) and credits. -->
<div class="dock">
  {#if mode === 'own' || mode === 'shared'}
    <nav class="actions" aria-label={mode === 'own' ? 'Send your details' : 'Report actions'}>
      {#if mode === 'own'}
        <button class="button" type="button" onclick={() => copy(link, LINK_COPIED)} disabled={!link}>
          Copy link
        </button>
        <button class="button primary" type="button" onclick={share} disabled={!link}>
          Share link
        </button>
      {:else}
        <a class="button" href="/" data-sveltekit-reload>Check my device</a>
        <button class="button primary" type="button" onclick={() => copy(fullText, TEXT_COPIED)}>
          Copy as text
        </button>
      {/if}
    </nav>
  {/if}
  <Credits />
</div>

<p class="toast" class:visible={Boolean(toast)} role="status">{toast}</p>

<style>
  .page {
    display: grid;
    gap: 1.75rem;
    width: min(100% - 2.5rem, 44rem);
    margin-inline: auto;
    padding-block: max(1.25rem, env(safe-area-inset-top)) calc(8.5rem + env(safe-area-inset-bottom));
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
</style>
