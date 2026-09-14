<script lang="ts">
import { onMount } from 'svelte'
import { copyText, shareLink } from '$lib/clipboard'
import { collectReport } from '$lib/device/collect'
import { applyLang, currentLang, fill, type Lang, parts, t } from '$lib/i18n'
import {
  decodeReport,
  encodeReport,
  HASH_PREFIX,
  needsDecompression,
  type Report,
  reportToText,
} from '$lib/report'
import Credits from '$lib/ui/Credits.svelte'
import PhoneQr from '$lib/ui/PhoneQr.svelte'
import ReportView from '$lib/ui/ReportView.svelte'
import SendPanel from '$lib/ui/SendPanel.svelte'

let lang = $state<Lang>('en')
const tr = (key: string): string => t(lang, key)

let mode = $state<'loading' | 'own' | 'shared' | 'broken'>('loading')
let report = $state.raw<Report | null>(null)
let note = $state('')
let link = $state('')
let home = $state('')
let tooOld = $state(false)
let toast = $state('')
let toastTimer: ReturnType<typeof setTimeout> | undefined

const outgoing = $derived(report && mode === 'own' ? { ...report, note: note.trim() } : report)
const fullText = $derived(outgoing ? reportToText(outgoing, link, true, lang) : '')
const mailto = $derived(
  outgoing
    ? `mailto:?subject=${encodeURIComponent(tr('My device details'))}&body=${encodeURIComponent(reportToText(outgoing, link, false, lang))}`
    : '',
)
const capturedAt = $derived(
  report
    ? new Date(report.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '',
)

async function load() {
  const payload = location.hash.replace(HASH_PREFIX, '')
  link = ''
  if (!payload) {
    report = await collectReport()
    mode = 'own'
    return
  }
  // Chat apps sometimes cut long links short, so a link that won't decode is an expected state.
  report = await decodeReport(payload).catch(() => null)
  link = location.href
  // Safari before 16.4 cannot unpack deflated links at all; a resend would fail the same way.
  tooOld = !report && needsDecompression(payload) && typeof DecompressionStream === 'undefined'
  mode = report ? 'shared' : 'broken'
}

onMount(() => {
  // The app runs, so the ES5 fallback for very old browsers in app.html can go.
  document.getElementById('fallback')?.remove()
  // Decide the language before the own/shared view renders. The page is prerendered in
  // English; this swaps it to the visitor's language on first mount.
  lang = currentLang()
  applyLang(lang)
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
    if (draft === outgoing) link = `${location.origin}/#${payload}`
  })
})

function flash(message: string) {
  toast = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast = ''
  }, 2600)
}

const blocked = () =>
  flash(tr('This browser blocked copying. Select the text and copy it yourself.'))

function copy(text: string, message: string) {
  copyText(text).then(() => flash(message), blocked)
}

function share() {
  shareLink(link, tr('My device details')).then((result) => {
    if (result === 'copied') flash(tr('Link copied. Paste it into your chat or email.'))
  }, blocked)
}

const copyRow = (label: string, value: string) =>
  copy(`${label}: ${value}`, fill(tr('Copied “{label}”.'), { label }))
const copyFullText = () => copy(fullText, tr('All details copied as text.'))
</script>

<svelte:head>
  <title
    >{mode === 'shared' ? tr('Device details someone sent you') : tr('Device details for support')}</title
  >
</svelte:head>

<main class="page">
  <header class="masthead rise">
    <a class="brand" href="/" data-sveltekit-reload>support<span>·</span>details</a>
    {#if mode === 'shared'}<span class="stamp">{tr('Received')}</span>{/if}
  </header>

  {#if mode === 'loading'}
    <section class="rise" style:--i={1}>
      <h1>{tr('Reading your device…')}</h1>
      <noscript>
        <p class="lede">
          {tr('This page needs JavaScript to read your device. Turn it on in your browser settings, then reload.')}
        </p>
      </noscript>
    </section>
  {:else if mode === 'broken'}
    <section class="stack rise" style:--i={1}>
      {#if tooOld}
        {@const old = parts(tr('It is too old to unpack the details. Open the link on a computer or a newer phone, or ask the sender to use {action} and send that instead.'), 'action')}
        <h1>{tr('This browser can’t open the link.')}</h1>
        <p class="lede">
          {old[0]}<strong>{tr('Copy as text')}</strong>{old[1]}
        </p>
      {:else}
        {@const cut = parts(tr('Part of it was probably cut off when it was sent. Ask the sender to tap {action} and send it again.'), 'action')}
        <h1>{tr('This link didn’t open.')}</h1>
        <p class="lede">
          {cut[0]}<strong>{tr('Copy link')}</strong>{cut[1]}
        </p>
      {/if}
      <a class="button primary" href="/" data-sveltekit-reload>{tr('Check this device instead')}</a>
    </section>
  {:else if report && mode === 'own'}
    {@const lede = parts(tr('Someone helping you needs to know which phone, browser and screen you use. It is all on this page. Tap {action} to send it to them.'), 'action')}
    <section class="rise" style:--i={1}>
      <h1>{tr('Your device details, ready to send.')}</h1>
      <p class="lede">
        {lede[0]}<strong>{tr('Share link')}</strong>{lede[1]}
      </p>
    </section>

    <PhoneQr
      url={home}
      title={tr('Need the details of your phone instead?')}
      body={tr('Point your phone’s camera at this code. The page opens on the phone and reads that phone.')}
      {lang}
    />

    <ReportView {report} oncopy={copyRow} {lang}>
      <SendPanel bind:note {link} {mailto} oncopytext={copyFullText} {lang} />
    </ReportView>
  {:else if report && mode === 'shared'}
    <section class="rise" style:--i={1}>
      <h1>{tr('Device details someone sent you.')}</h1>
      <p class="lede">
        {fill(tr('Captured {date}, your time. Everything below describes the sender’s device, not the one you are using now.'), { date: capturedAt })}
      </p>
      {#if report.note}
        <blockquote class="note">
          <span class="eyebrow">{tr('Note from the sender')}</span>
          <bdi>{report.note}</bdi>
        </blockquote>
      {/if}
    </section>

    <ReportView {report} oncopy={copyRow} {lang}>
      <div class="actions rise" style:--i={1}>
        <button
          class="button"
          type="button"
          onclick={() => copy(JSON.stringify(report, null, 2), tr('Copied as JSON.'))}
        >
          {tr('Copy as JSON')}
        </button>
        <button class="button" type="button" onclick={() => copy(link, tr('Link copied.'))}>
          {tr('Copy link')}
        </button>
      </div>
    </ReportView>
  {/if}
</main>

<!-- Fixed to the bottom of the viewport: actions (primary on the right, under the thumb) and credits. -->
<div class="dock">
  {#if mode === 'own' || mode === 'shared'}
    <nav class="actions" aria-label={mode === 'own' ? tr('Send your details') : tr('Report actions')}>
      {#if mode === 'own'}
        <button
          class="button"
          type="button"
          onclick={() => copy(link, tr('Link copied. Paste it into your chat or email.'))}
          disabled={!link}
        >
          {tr('Copy link')}
        </button>
        <button class="button primary" type="button" onclick={share} disabled={!link}>
          {tr('Share link')}
        </button>
      {:else}
        <a class="button" href="/" data-sveltekit-reload>{tr('Check my device')}</a>
        <button class="button primary" type="button" onclick={copyFullText}>
          {tr('Copy as text')}
        </button>
      {/if}
    </nav>
  {/if}
  <Credits {lang} />
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
    border-inline-start: 4px solid var(--carbon);
    border-start-end-radius: 12px;
    border-end-end-radius: 12px;
    border-start-start-radius: 0;
    border-end-start-radius: 0;
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
