<script lang="ts">
import { type Lang, t } from '$lib/lang'
import ShareGuide from './ShareGuide.svelte'

type Props = { note: string; link: string; mailto: string; oncopytext: () => void; lang: Lang }

let { note = $bindable(), link, mailto, oncopytext, lang }: Props = $props()

const tr = (key: string): string => t(lang, key)
</script>

<section class="send rise" style:--i={1} aria-labelledby="send-title">
  <h2 id="send-title">{tr('Send it')}</h2>
  <label class="field">
    <span>{tr('Add a note')} <em>{tr('(optional)')}</em></span>
    <input
      bind:value={note}
      maxlength="140"
      autocomplete="off"
      enterkeyhint="done"
      placeholder={tr('Your name, ticket number, or what went wrong')}
    />
  </label>
  <ShareGuide {lang} />
  <!-- The dock covers the common case; the other ways stay one tap away. -->
  <details class="more">
    <summary>{tr('Other ways to send')}</summary>
    <div class="more-body">
      <div class="actions">
        <button class="button" type="button" onclick={oncopytext}>{tr('Copy as text')}</button>
        <a class="button" href={mailto}>{tr('Email it')}</a>
      </div>
      <label class="field">
        <span>{tr('Your link')}</span>
        <input class="link" readonly value={link} onfocus={(event) => event.currentTarget.select()} />
      </label>
    </div>
  </details>
</section>

<style>
  .send {
    display: grid;
    gap: 1.25rem;
    padding: 1.25rem;
    border: 1.5px solid var(--ink);
    border-radius: var(--radius);
  }

  .more {
    border-top: 1px dashed var(--rule);
  }

  .more summary {
    display: flex;
    align-items: center;
    min-height: 2.75rem;
    padding-top: 0.5rem;
    color: var(--carbon);
    font-weight: 600;
    cursor: pointer;
  }

  .more-body {
    display: grid;
    gap: 1rem;
    padding-top: 0.75rem;
  }

  .field .link {
    color: var(--carbon);
    font-family: var(--font-mono);
    font-size: 0.85rem;
  }
</style>
