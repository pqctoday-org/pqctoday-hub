// SPDX-License-Identifier: GPL-3.0-only
/**
 * MiniPkcsLog — inline PKCS#11 call log with parameter inspection.
 *
 * Reads from HsmContext (no props required). Delegates rendering to the shared
 * Pkcs11LogPanel so all playground panels get the full inspect capability
 * (clickable rows → decoded CK_MECHANISM / CK_ATTRIBUTE templates).
 *
 * Clearing is SCOPED to this pane: the Clear button hides entries older than
 * the clear point from this inline view only, and never touches the shared
 * HsmContext log. The Logs tab is the playground's cross-tab inspection
 * surface — an in-pane "Clear" wiping it would silently destroy the visitor's
 * whole session trace (2026-08-13 audit, N14). Only the Logs tab's own Clear
 * button truly empties the shared log.
 */
import { useMemo, useState } from 'react'
import { useHsmContext } from '../hsm/HsmContext'
import { Pkcs11LogPanel } from '../../shared/Pkcs11LogPanel'

interface MiniPkcsLogProps {
  /** Show the Beginner-mode plain-English column. Default false (workbench tabs). */
  showBeginnerMode?: boolean
  /**
   * Lesson context: skip the "Crypto Only" allowlist filter entirely (every
   * call a lesson step makes is the point, including C_Initialize/C_Login),
   * and hide the now-meaningless toggle. Default false (workbench tabs).
   */
  lessonMode?: boolean
  /** Panel title override (e.g. "PKCS#11 Call Log — Key Wrap"). */
  title?: string
  /** Render expanded on mount. */
  defaultOpen?: boolean
}

export const MiniPkcsLog = ({
  showBeginnerMode = false,
  lessonMode = false,
  title,
  defaultOpen,
}: MiniPkcsLogProps) => {
  const { hsmLog } = useHsmContext()
  // Id of the newest shared-log entry at the moment the user last clicked
  // Clear in THIS pane. Entries at or beyond that point are hidden here but
  // stay in the shared log (and the Logs tab).
  const [clearedAtId, setClearedAtId] = useState<number | null>(null)

  const visibleLog = useMemo(() => {
    if (clearedAtId === null) return hsmLog
    const idx = hsmLog.findIndex((e) => e.id === clearedAtId)
    // Marker no longer present ⇒ it aged out of the shared log's cap, so
    // every remaining entry is newer than the clear point — show them all.
    if (idx === -1) return hsmLog
    // hsmLog is newest-first; entries before idx are newer than the marker.
    return hsmLog.slice(0, idx)
  }, [hsmLog, clearedAtId])

  return (
    <Pkcs11LogPanel
      log={visibleLog}
      onClear={() => {
        if (hsmLog.length > 0) setClearedAtId(hsmLog[0].id)
      }}
      showBeginnerMode={showBeginnerMode}
      lessonMode={lessonMode}
      title={title}
      defaultOpen={defaultOpen}
    />
  )
}
