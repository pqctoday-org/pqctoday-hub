// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../../ui/button'
import { ErrorAlert } from '../../../ui/error-alert'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { useHsmContext, type HsmKey } from '../HsmContext'
import {
  decodeProtectedBackup,
  encodeProtectedBackup,
  loadProtectedBackupBindings,
  type ProtectedBackupSession,
  type ProtectedKeyResult,
} from '../../../../wasm/protectedBackup'

export function ProtectedBackupPanel() {
  const { moduleRef, engineMode, isReady, registerKey, removeHsmKey, hsmKeysRef, hSessionRef } =
    useHsmContext()
  const ownerModule = moduleRef.current
  const ownerSession = hSessionRef.current
  const lab = useRef<ProtectedBackupSession | null>(null)
  const owned = useRef<HsmKey[]>([])
  const epoch = useRef(0)
  const [connected, setConnected] = useState(false)
  const [algorithm, setAlgorithm] = useState('0')
  const [representation, setRepresentation] = useState<'seed' | 'expanded'>('seed')
  const [key, setKey] = useState<number | null>(null)
  const [packageBytes, setPackageBytes] = useState<Uint8Array | null>(null)
  const [recovered, setRecovered] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const generation = ++epoch.current
    setBusy(false)
    setError(null)
    setConnected(false)
    setKey(null)
    setPackageBytes(null)
    setRecovered(null)
    return () => {
      epoch.current = generation + 1
      lab.current?.free()
      lab.current = null
      owned.current.forEach(removeHsmKey)
      owned.current = []
    }
  }, [engineMode, isReady, ownerModule, ownerSession, removeHsmKey])

  const register = (result: ProtectedKeyResult, restored: boolean) => {
    const M = moduleRef.current
    if (!M) throw new Error('Initialize the Rust engine first.')
    const family = result.key_type === 0x49 ? 'ml-kem' : result.key_type === 0x4a ? 'ml-dsa' : null
    if (!family || result.parameter_set !== 2)
      throw new Error('The engine returned an unsupported protected key type or parameter set.')
    const variant = family === 'ml-kem' ? '768' : '65'
    for (const [handle, role] of [
      [result.public_handle, 'public'],
      [result.private_handle, 'private'],
    ] as const) {
      if (
        hsmKeysRef.current.some(
          (k) =>
            k.handle === handle && k.sessionHandle === result.session_handle && k.engine === 'rust'
        )
      )
        continue
      owned.current.push(
        registerKey(M, result.session_handle, {
          handle,
          role,
          family,
          variant,
          engine: 'rust',
          sessionHandle: result.session_handle,
          label: `${family === 'ml-kem' ? 'ML-KEM' : 'ML-DSA'}-${variant} ${role} (${restored ? 'recovered' : 'enrolled backup demo'})`,
          generatedAt: new Date().toISOString(),
        })
      )
    }
    return `${family === 'ml-kem' ? 'ML-KEM' : 'ML-DSA'}-${variant}`
  }

  const run = async (action: (generation: number) => Promise<void> | void) => {
    const generation = epoch.current
    setBusy(true)
    setError(null)
    setRecovered(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 0))
      if (generation !== epoch.current) return
      await action(generation)
    } catch (err) {
      if (generation === epoch.current)
        setError(
          typeof err === 'number'
            ? `Protected operation refused (PKCS#11 0x${err.toString(16)}).`
            : String(err)
        )
    } finally {
      if (generation === epoch.current) setBusy(false)
    }
  }

  const exportPackage = () => {
    if (!packageBytes) return
    const url = URL.createObjectURL(
      new Blob([encodeProtectedBackup(packageBytes)], { type: 'application/json' })
    )
    const a = document.createElement('a')
    a.href = url
    a.download = 'protected-pqc-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section aria-label="Protected PQC backup" className="glass-panel p-4 space-y-3">
      <h3 className="font-semibold text-sm">Protected PQC backup</h3>
      <p className="text-xs text-muted-foreground">
        Supported here: Rust ML-KEM-768 and ML-DSA-65. Other parameter sets and engine modes are
        unavailable in this rollout. Seed and Expanded use the existing authenticated replication
        package, enrolled policies and recovery receipts. This is a separate workflow from the
        AES/RSA/hybrid wrapping exercises below.
      </p>
      <p className="text-xs text-muted-foreground">
        PQCTODAY EDUCATIONAL TEST ONLY. Setup creates three new enrolled demo tokens and new
        policy-bound keys. Existing unbound keys cannot be enrolled retroactively. Keep this panel
        and HSM session open: leaving the panel, resetting the engine or reloading ends this demo;
        downloads alone do not preserve the destination recovery key.
      </p>
      {engineMode !== 'rust' ? (
        <p role="status" className="text-sm">
          Protected backup is unavailable in this engine mode. Select Rust to use the two supported
          profiles. Other engines and parameter sets are unavailable in this rollout.
        </p>
      ) : (
        <>
          <Button
            disabled={!isReady || busy || connected}
            onClick={() =>
              void run(async (generation) => {
                const bindings = await loadProtectedBackupBindings()
                if (generation !== epoch.current) return
                bindings.pqctodaySelectEducationalReplicationProfile()
                lab.current = new bindings.ProtectedBackupLab('demo-so-pin', 'demo-user-pin')
                setConnected(true)
              })
            }
          >
            {busy && !connected ? 'Enrolling demo tokens…' : 'Create enrolled demo tokens'}
          </Button>
          <div className="flex flex-wrap gap-3 items-center">
            <FilterDropdown
              items={[
                { id: '0', label: 'ML-KEM-768' },
                { id: '1', label: 'ML-DSA-65' },
              ]}
              selectedId={algorithm}
              disabled={busy}
              ariaLabel="Protected backup algorithm"
              hideDefaultOption
              noContainer
              size="sm"
              onSelect={(value) => {
                setAlgorithm(value)
                setKey(null)
                setPackageBytes(null)
                setRecovered(null)
              }}
            />
            <Button
              disabled={!connected || busy}
              onClick={() =>
                void run(() => {
                  const result = lab.current!.generate(Number(algorithm))
                  try {
                    register(result, false)
                    setKey(result.private_handle)
                    setPackageBytes(null)
                  } finally {
                    result.free()
                  }
                })
              }
            >
              Generate enrolled key
            </Button>
          </div>
          <div
            role="group"
            aria-label="Protected backup representation"
            className="flex flex-wrap gap-2"
          >
            {(['seed', 'expanded'] as const).map((r) => (
              <Button
                key={r}
                disabled={busy}
                aria-pressed={representation === r}
                onClick={() => {
                  setRepresentation(r)
                  setPackageBytes(null)
                  setRecovered(null)
                }}
              >
                {r === 'seed' ? 'Seed' : 'Expanded'}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Seed retains the real generation seed inside the engines. Expanded restores the full
            private key without claiming seed retention. Separate enrolled destination tokens allow
            both representations to be tested.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!key || busy}
              onClick={() =>
                void run(() =>
                  setPackageBytes(lab.current!.backup(key!, representation === 'seed'))
                )
              }
            >
              Create protected backup
            </Button>
            <Button disabled={!packageBytes || busy} onClick={exportPackage}>
              Export protected package
            </Button>
            <Button
              disabled={!packageBytes || busy || !connected}
              onClick={() =>
                void run(() => {
                  const result = lab.current!.recover(packageBytes!)
                  try {
                    const name = register(result, true)
                    setRecovered(
                      `${name} recovered; original public-key identity and signed receipt verified. Private h=${result.private_handle}; public h=${result.public_handle}.`
                    )
                  } finally {
                    result.free()
                  }
                })
              }
            >
              Recover and verify identity
            </Button>
          </div>
          <label className="block text-xs">
            Import a protected package from this demo session
            <input
              aria-label="Import protected backup"
              type="file"
              accept=".json,application/json"
              disabled={!connected || busy}
              className="block mt-1 max-w-full"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setPackageBytes(null)
                void run(async (generation) => {
                  if (file.size > 600000) throw new Error('Backup file is too large.')
                  const bytes = decodeProtectedBackup(await file.text())
                  if (generation === epoch.current) setPackageBytes(bytes)
                })
                e.target.value = ''
              }}
            />
          </label>
          {packageBytes && (
            <p role="status" className="text-xs">
              Protected package loaded: {packageBytes.length.toLocaleString()} bytes. Recovery uses
              authenticated engine metadata, not file labels.
            </p>
          )}
          {recovered && (
            <p role="status" className="text-sm text-success">
              {recovered}
            </p>
          )}
        </>
      )}
      {error && <ErrorAlert message={error} />}
    </section>
  )
}
