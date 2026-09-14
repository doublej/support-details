/** Copy and share-sheet helpers, with fallbacks for old phones, in-app browsers and plain HTTP. */
export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text)
  // execCommand is deprecated, but it is the only copy path on insecure pages and old WebViews.
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.append(area)
  area.select()
  area.setSelectionRange(0, text.length)
  document.execCommand('copy')
  area.remove()
}

export type ShareResult = 'shared' | 'copied' | 'cancelled'

/** Opens the system share sheet, or copies the link where there is none. Call inside the tap. */
export async function shareLink(url: string, title: string): Promise<ShareResult> {
  const data = { title, url }
  if (!navigator.canShare?.(data)) {
    await copyText(url)
    return 'copied'
  }
  try {
    await navigator.share(data)
    return 'shared'
  } catch (error) {
    // Closing the share sheet rejects with AbortError: a choice, not a failure.
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
    throw error
  }
}
