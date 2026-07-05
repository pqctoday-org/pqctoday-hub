// SPDX-License-Identifier: GPL-3.0-only
//
// Dedicated KMIP engine instance for the Migration tab — its own PKCS#11
// slot (hermetic keystore beside the workbench's slot-0 singleton), booted
// once per page load, with migration-classical.yaml active from the start.

import { useEffect, useState } from 'react'
import { KmipEngine } from '@/wasm/kmip/kmipEngine'
import { MIGRATION_POLICIES, MIGRATION_SLOT } from './migrationKeys'

let migrationEnginePromise: Promise<KmipEngine> | null = null

/** Boot (once) the Migration tab's dedicated engine and activate the
 * classical estate policy. Module-level so tab switches don't re-boot the
 * slot (re-booting a slot with an open session fails, CK_RV 0xb6). */
export const getMigrationEngine = (): Promise<KmipEngine> => {
  if (!migrationEnginePromise) {
    migrationEnginePromise = (async () => {
      const engine = await KmipEngine.boot(MIGRATION_SLOT)
      const classical = MIGRATION_POLICIES.find((p) => p.available)
      if (classical) {
        const yaml = await fetch(`/kmip-policies/${classical.file}`).then((r) => r.text())
        const res = engine.loadPolicy(yaml)
        if (!res.ok) throw new Error(`activating ${classical.name}: ${res.error}`)
      }
      return engine
    })().catch((e) => {
      migrationEnginePromise = null
      throw e
    })
  }
  return migrationEnginePromise
}

export interface MigrationEngineState {
  engine: KmipEngine | null
  policyName: string | null
  bootError: string | null
}

/** React hook wrapping [`getMigrationEngine`]. */
export const useMigrationEngine = (): MigrationEngineState => {
  const [state, setState] = useState<MigrationEngineState>({
    engine: null,
    policyName: null,
    bootError: null,
  })

  useEffect(() => {
    let alive = true
    getMigrationEngine()
      .then((engine) => {
        if (!alive) return
        setState({
          engine,
          policyName: engine.policyStatus().name ?? null,
          bootError: null,
        })
      })
      .catch((e: unknown) => {
        if (!alive) return
        setState({ engine: null, policyName: null, bootError: String(e) })
      })
    return () => {
      alive = false
    }
  }, [])

  return state
}
