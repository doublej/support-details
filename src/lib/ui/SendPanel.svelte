<script lang="ts">
import ShareGuide from './ShareGuide.svelte'

type Props = { note: string; link: string; mailto: string; oncopytext: () => void }

let { note = $bindable(), link, mailto, oncopytext }: Props = $props()
</script>

<section class="send rise" style:--i={1} aria-labelledby="send-title">
  <h2 id="send-title">Send it</h2>
  <label class="field">
    <span>Add a note <em>(optional)</em></span>
    <input
      bind:value={note}
      maxlength="140"
      autocomplete="off"
      enterkeyhint="done"
      placeholder="Your name, ticket number, or what went wrong"
    />
  </label>
  <div class="actions">
    <button class="button" type="button" onclick={oncopytext}>Copy as text</button>
    <a class="button" href={mailto}>Email it</a>
  </div>
  <label class="field">
    <span>Your link</span>
    <input class="link" readonly value={link} onfocus={(event) => event.currentTarget.select()} />
  </label>
  <ShareGuide />
</section>

<style>
  .send {
    display: grid;
    gap: 1.25rem;
    padding: 1.25rem;
    border: 1.5px solid var(--ink);
    border-radius: var(--radius);
  }

  .field .link {
    color: var(--carbon);
    font-family: var(--font-mono);
    font-size: 0.85rem;
  }
</style>
