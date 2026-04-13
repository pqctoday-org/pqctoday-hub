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

export const MiniPkcsLog = () => {
  const { hsmLog, clearHsmLog } = useHsmContext()
  return <Pkcs11LogPanel log={hsmLog} onClear={clearHsmLog} />
}
