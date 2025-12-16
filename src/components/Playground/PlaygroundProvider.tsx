import React, { useEffect } from 'react'
import { SettingsProvider } from './contexts/SettingsProvider'
import { KeyStoreProvider } from './contexts/KeyStoreProvider'
import { OperationsProvider } from './contexts/OperationsProvider'
import { openSSLService } from '../../services/crypto/OpenSSLService'
import * as MLKEM from '../../wasm/liboqs_kem'
import * as MLDSA from '../../wasm/liboqs_dsa'

export const PlaygroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pre-load OpenSSL and Cleanup on unmount
  useEffect(() => {
    // Start initialization immediately
    openSSLService.init().catch(console.error)

    return () => {
      // Terminate OpenSSL worker to free resources
      openSSLService.terminate()

      // Clear WASM instance caches to free ~2-3MB
      MLKEM.clearInstanceCache()
      MLDSA.clearInstanceCache()
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
