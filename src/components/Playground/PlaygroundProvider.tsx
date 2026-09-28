// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect } from 'react'
import { SettingsProvider } from './contexts/SettingsProvider'
import { KeyStoreProvider } from './contexts/KeyStoreProvider'
import { OperationsProvider } from './contexts/OperationsProvider'
import { HsmProvider } from './hsm/HsmContext'
import * as MLKEM from '../../wasm/liboqs_kem'
import * as MLDSA from '../../wasm/liboqs_dsa'
import * as LIBOQS_SIG from '../../wasm/liboqs_sig'
import { clearSoftHSMCache } from '../../wasm/softhsm'
import { resetDevSlotCache } from './dev/pipeline/devSlot'

export const PlaygroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Cleanup WASM instance caches on unmount to free ~2-3MB
  useEffect(() => {
    return () => {
      try {
        MLKEM.clearInstanceCache()
        MLDSA.clearInstanceCache()
        LIBOQS_SIG.clearInstanceCache()
        // Close the Developer tab's kept-open session and forget its slot id
        // BEFORE dropping the module singletons they belong to. This is the
        // owner of that session's lifetime — deliberately not the Developer
        // panel itself, which is mounted and unmounted by a mere tab switch
        // (see devSlot.ts's "ONE kept-open Developer-slot session" comment).
        resetDevSlotCache()
        clearSoftHSMCache()
      } catch (e) {
        console.error('WASM cleanup error:', e)
      }
    }
  }, [])

  return (
    <HsmProvider>
      <SettingsProvider>
        <KeyStoreProvider>
          <OperationsProvider>{children}</OperationsProvider>
        </KeyStoreProvider>
      </SettingsProvider>
    </HsmProvider>
  )
}
