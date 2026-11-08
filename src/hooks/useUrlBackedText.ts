// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Text for a search box that is also kept in the address.
 *
 * The box shows its own text at once. Reading it back from the address instead drops or doubles
 * characters while typing, because react-router applies an address change in a transition, so a
 * controlled input fed from the address is put back to the old text after each key until the
 * change lands (worst with fast typing, edits in the middle of a word, and phone keyboards that
 * autocorrect or compose text).
 *
 * `urlValue` is the text currently in the address and `writeToUrl` writes new text there. Every
 * value this hook writes is remembered, and when the address later shows one of them (its own
 * echo, possibly late or with keystrokes skipped) the box is left alone. Any other change to the
 * address, such as a link followed while the page is open, replaces the box text.
 *
 * `update(next)` is for typing: it shows `next` and writes it. `reset(next)` shows `next` without
 * writing, for a caller that changes the address itself in one navigation together with other
 * parameters and expects `next` to come back.
 */
export function useUrlBackedText(
  urlValue: string,
  writeToUrl: (next: string) => void
): { text: string; update: (next: string) => void; reset: (next: string) => void } {
  const [text, setText] = useState(urlValue)
  // The address text last reconciled with, and the values written to it that it has not shown
  // back yet (oldest first). Both are state, not refs, so the reconciliation below can happen
  // while rendering, the way React documents for state that follows a changing input.
  const [seenUrl, setSeenUrl] = useState(urlValue)
  const [pending, setPending] = useState<string[]>([])
  const writeRef = useRef(writeToUrl)
  useEffect(() => {
    writeRef.current = writeToUrl
  })

  if (urlValue !== seenUrl) {
    setSeenUrl(urlValue)
    const at = pending.indexOf(urlValue)
    if (at >= 0) {
      // Our own write coming back: everything up to it has landed.
      setPending(pending.slice(at + 1))
    } else {
      // Someone else changed the address: show it, and forget writes it never echoed.
      setPending([])
      setText(urlValue)
    }
  }

  const update = useCallback((next: string) => {
    setText(next)
    setPending((p) => [...p, next])
    writeRef.current(next)
  }, [])

  const reset = useCallback((next: string) => {
    setText(next)
    setPending((p) => [...p, next])
  }, [])

  return { text, update, reset }
}
