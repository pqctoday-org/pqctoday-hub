// SPDX-License-Identifier: GPL-3.0-only
/**
 * MiniPkcsLog — inline PKCS#11 call log with parameter inspection.
 *
 * Reads from HsmContext (no props). Delegates rendering to the shared
 * Pkcs11LogPanel so all playground panels get the full inspect capability
 * (clickable rows → decoded CK_MECHANISM / CK_ATTRIBUTE templates).
 */
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
}

export const MiniPkcsLog = ({ showBeginnerMode = false, lessonMode = false }: MiniPkcsLogProps) => {
  const { hsmLog, clearHsmLog } = useHsmContext()
  return (
    <Pkcs11LogPanel
      log={hsmLog}
      onClear={clearHsmLog}
      showBeginnerMode={showBeginnerMode}
      lessonMode={lessonMode}
    />
  )
}
