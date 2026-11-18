// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Copy text to the clipboard, tolerating a denied/unavailable Clipboard API
 * (common in sandboxed iframes, insecure contexts, or without a user
 * gesture). Falls back to the legacy execCommand path, then gives up
 * silently rather than throwing an uncaught NotAllowedError.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const previous = document.activeElement
    const textarea = document.createElement('textarea')
    try {
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      textarea.remove()
      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus({ preventScroll: true })
      }
    }
  }
}
