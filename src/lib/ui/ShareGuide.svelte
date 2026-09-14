<script lang="ts">
// Static copy: how to send the link, and what the link does and does not contain.
</script>

<section class="guide" aria-labelledby="guide-title">
  <h3 id="guide-title">How to send it</h3>
  <ol class="steps">
    <li>
      <span><strong>Tap “Share link”</strong> at the bottom of the screen. Your phone opens its share menu.</span>
    </li>
    <li>
      <span><strong>Pick the app you are talking in</strong>, like WhatsApp, Messages, Mail, Teams or Slack.</span>
    </li>
    <li>
      <span><strong>Send it.</strong> When they open the link, they see this page with your details filled in.</span>
    </li>
  </ol>
  <p class="aside">
    No share menu, or nothing happens? Tap <strong>Copy link</strong>. Then press and hold in the
    message box and choose <strong>Paste</strong>. On a computer, click in the message box and press
    Ctrl+V (⌘V on a Mac).
  </p>

  <details class="privacy">
    <summary>What is in the link, and is it safe?</summary>
    <ul>
      <li>The details are packed into the link itself. Nothing is uploaded or saved on this website.</li>
      <li>
        It holds what you see on this page: device, browser, screen and settings. Every website you
        visit can already read these.
      </li>
      <li>No name (unless you add one in the note), no location, no IP address, no photos, no passwords.</li>
      <li>Anyone who has the link can read it, so send it only to the person helping you.</li>
    </ul>
  </details>
</section>

<style>
  .guide {
    display: grid;
    gap: 1rem;
    padding-top: 1.25rem;
    border-top: 1px dashed var(--rule);
  }

  h3 {
    margin: 0;
    font-size: 1.15rem;
  }

  .steps {
    display: grid;
    gap: 0.9rem;
    margin: 0;
    padding: 0;
    list-style: none;
    counter-reset: step;
  }

  .steps li {
    display: grid;
    grid-template-columns: 2.25rem 1fr;
    gap: 0.75rem;
    align-items: start;
    counter-increment: step;
  }

  .steps li::before {
    content: counter(step);
    display: grid;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    border: 1.5px solid var(--carbon);
    border-radius: 50%;
    color: var(--carbon);
    font-family: var(--font-mono);
    font-weight: 500;
  }

  .steps span {
    padding-top: 0.3rem;
  }

  .aside {
    margin: 0;
    color: var(--ink-soft);
    font-size: 0.95rem;
  }

  .privacy summary {
    display: flex;
    align-items: center;
    min-height: 2.75rem;
    color: var(--carbon);
    font-weight: 600;
    cursor: pointer;
  }

  .privacy ul {
    display: grid;
    gap: 0.5rem;
    margin: 0.25rem 0 0;
    padding-left: 1.1rem;
    color: var(--ink-soft);
    font-size: 0.95rem;
  }
</style>
