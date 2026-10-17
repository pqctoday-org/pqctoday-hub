// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useEffect, useRef } from 'react'

/**
 * Keeps keyboard focus on a run button that disables itself while running.
 *
 * A disabled button loses focus to <body>, so a keyboard user who pressed it
 * lands at the top of the page when the run ends. Call `markRunStart()` at
 * the start of the run; if the button had focus then, it gets focus back as
 * soon as `running` turns false and the button is enabled again.
 */
export function useRestoreFocusAfterRun<T extends HTMLElement = HTMLButtonElement>(
  running: boolean
) {
  const ref = useRef<T>(null)
  const hadFocus = useRef(false)

  const markRunStart = useCallback(() => {
    hadFocus.current = !!ref.current && document.activeElement === ref.current
  }, [])

  useEffect(() => {
    if (running || !hadFocus.current) return
    hadFocus.current = false
    ref.current?.focus()
  }, [running])

  return { ref, markRunStart }
}
