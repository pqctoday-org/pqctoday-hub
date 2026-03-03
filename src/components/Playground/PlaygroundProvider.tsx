// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect } from 'react'
import { SettingsProvider } from './contexts/SettingsProvider'
import { KeyStoreProvider } from './contexts/KeyStoreProvider'
import { OperationsProvider } from './contexts/OperationsProvider'
import * as MLKEM from '../../wasm/liboqs_kem'
import * as MLDSA from '../../wasm/liboqs_dsa'
import * as LIBOQS_SIG from '../../wasm/liboqs_sig'
import { clearSoftHSMCache } from '../../wasm/softhsm'

export const PlaygroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Cleanup WASM instance caches on unmount to free ~2-3MB
  useEffect(() => {
    return () => {
      try {
        MLKEM.clearInstanceCache()
        MLDSA.clearInstanceCache()
        LIBOQS_SIG.clearInstanceCache()
        clearSoftHSMCache()
      } catch (e) {
        console.error('WASM cleanup error:', e)
      }
    }
  }, [])

  return (
    <SettingsProvider>
      <KeyStoreProvider>
        <OperationsProvider>{children}</OperationsProvider>
      </KeyStoreProvider>
    </SettingsProvider>
  )
}
