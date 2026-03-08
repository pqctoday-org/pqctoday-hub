// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Activity, Lock, Key as KeyIcon, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useSettingsContext } from '../contexts/SettingsContext'
import { useKeyStoreContext } from '../contexts/KeyStoreContext'
import { useOperationsContext } from '../contexts/OperationsContext'
import { useHsmContext } from '../hsm/HsmContext'
import { DataInput } from '../DataInput'
import { logEvent } from '../../../utils/analytics'
import { Button } from '../../ui/button'
import { ErrorAlert } from '../../ui/error-alert'
import { FilterDropdown } from '../../common/FilterDropdown'
import {
  hsm_generateMLKEMKeyPair,
  hsm_encapsulate,
  hsm_decapsulate,
  hsm_extractKeyValue,
} from '../../../wasm/softhsm'

// ── HSM KEM Panel ─────────────────────────────────────────────────────────────

const KEM_SIZES: Record<512 | 768 | 1024, { pub: number; ct: number; ss: number }> = {
  512: { pub: 800, ct: 768, ss: 32 },
  768: { pub: 1184, ct: 1088, ss: 32 },
  1024: { pub: 1568, ct: 1568, ss: 32 },
}

const toHexSnippet = (b: Uint8Array) => {
  const h = Array.from(b)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
  return h.length > 40 ? `${h.slice(0, 20)}…${h.slice(-8)}` : h
}

const arraysEqual = (a: Uint8Array, b: Uint8Array) => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

const HsmKemPanel: React.FC = () => {
  const { moduleRef, hSessionRef, isReady, addHsmKey } = useHsmContext()

  const [variant, setVariant] = useState<512 | 768 | 1024>(768)
  const [handles, setHandles] = useState<{ pub: number; priv: number } | null>(null)
  const [ciphertext, setCiphertext] = useState<Uint8Array | null>(null)
  const [secret1, setSecret1] = useState<Uint8Array | null>(null)
  const [secret2, setSecret2] = useState<Uint8Array | null>(null)
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [kemError, setKemError] = useState<string | null>(null)

  const anyLoading = loadingOp !== null

  const changeVariant = (v: 512 | 768 | 1024) => {
    setVariant(v)
    setHandles(null)
    setCiphertext(null)
    setSecret1(null)
    setSecret2(null)
    setKemError(null)
  }

  const withLoading = async (op: string, fn: () => Promise<void>) => {
    setLoadingOp(op)
    try {
      await fn()
    } finally {
      setLoadingOp(null)
    }
  }

  const doGenKeyPair = () =>
    withLoading('gen', async () => {
      setKemError(null)
      setCiphertext(null)
      setSecret1(null)
      setSecret2(null)
      try {
        const M = moduleRef.current
        if (!M) throw new Error('Module not loaded — complete Token Setup first')
        const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(M, hSessionRef.current, variant)
        setHandles({ pub: pubHandle, priv: privHandle })
        const ts = new Date().toLocaleTimeString([], {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        addHsmKey({
          handle: pubHandle,
          family: 'ml-kem',
          role: 'public',
          label: `ML-KEM-${variant} Public Key`,
          variant: String(variant),
          generatedAt: ts,
        })
        addHsmKey({
          handle: privHandle,
          family: 'ml-kem',
          role: 'private',
          label: `ML-KEM-${variant} Private Key`,
          variant: String(variant),
          generatedAt: ts,
        })
      } catch (e) {
        setKemError(String(e))
      }
    })

  const doEncapsulate = () =>
    withLoading('enc', async () => {
      setKemError(null)
      setSecret1(null)
      setSecret2(null)
      try {
        const M = moduleRef.current!
        const { ciphertextBytes, secretHandle } = hsm_encapsulate(
          M,
          hSessionRef.current,
          handles!.pub,
          variant
        )
        const ss = hsm_extractKeyValue(M, hSessionRef.current, secretHandle)
        setCiphertext(ciphertextBytes)
        setSecret1(ss)
      } catch (e) {
        setKemError(String(e))
      }
    })

  const doDecapsulate = () =>
    withLoading('dec', async () => {
      setKemError(null)
      setSecret2(null)
      try {
        const M = moduleRef.current!
        const ssH2 = hsm_decapsulate(M, hSessionRef.current, handles!.priv, ciphertext!, variant)
        const ss2 = hsm_extractKeyValue(M, hSessionRef.current, ssH2)
        setSecret2(ss2)
      } catch (e) {
        setKemError(String(e))
      }
    })

  const secretsMatch = secret1 && secret2 ? arraysEqual(secret1, secret2) : null

  return (
    <div className={`space-y-4 ${!isReady ? 'opacity-60 pointer-events-none' : ''}`}>
      {!isReady && (
        <div className="glass-panel p-3 text-sm text-muted-foreground">
          Complete Token Setup in the Key Store tab first.
        </div>
      )}

      <div className="glass-panel p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-sm">ML-KEM Key Encapsulation (FIPS 203)</h3>
          <div className="flex gap-1">
            {([512, 768, 1024] as const).map((v) => (
              <Button
                key={v}
                variant="ghost"
                size="sm"
                disabled={anyLoading}
                onClick={() => changeVariant(v)}
                className={
                  variant === v
                    ? 'bg-primary/20 text-primary text-xs px-2 py-1 h-auto'
                    : 'text-muted-foreground text-xs px-2 py-1 h-auto'
                }
              >
                ML-KEM-{v}
              </Button>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-mono">
          pub: {KEM_SIZES[variant].pub} B · ct: {KEM_SIZES[variant].ct} B · ss:{' '}
          {KEM_SIZES[variant].ss} B
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={anyLoading} onClick={doGenKeyPair}>
            {loadingOp === 'gen' && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            {handles ? '✓ Key Pair' : 'Generate Key Pair'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!handles || anyLoading}
            onClick={doEncapsulate}
          >
            {loadingOp === 'enc' && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Encapsulate
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!ciphertext || anyLoading}
            onClick={doDecapsulate}
          >
            {loadingOp === 'dec' && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Decapsulate
          </Button>
        </div>

        <div className="space-y-1.5 text-xs font-mono">
          {handles && (
            <div className="flex gap-3 text-muted-foreground">
              <span>pubH={handles.pub}</span>
              <span>privH={handles.priv}</span>
            </div>
          )}
          {ciphertext && (
            <div className="flex gap-3 bg-muted rounded px-2 py-1">
              <span className="text-muted-foreground w-20 shrink-0">Ciphertext</span>
              <span className="truncate">{toHexSnippet(ciphertext)}</span>
              <span className="text-muted-foreground shrink-0">{ciphertext.length} B</span>
            </div>
          )}
          {secret1 && (
            <div className="flex gap-3 bg-muted rounded px-2 py-1">
              <span className="text-muted-foreground w-20 shrink-0">SS₁ (enc)</span>
              <span className="truncate">{toHexSnippet(secret1)}</span>
              <span className="text-muted-foreground shrink-0">{secret1.length} B</span>
            </div>
          )}
          {secret2 && (
            <div className="flex gap-3 bg-muted rounded px-2 py-1">
              <span className="text-muted-foreground w-20 shrink-0">SS₂ (dec)</span>
              <span className="truncate">{toHexSnippet(secret2)}</span>
              <span className="text-muted-foreground shrink-0">{secret2.length} B</span>
            </div>
          )}
          {secretsMatch !== null && (
            <div
              className={`flex items-center gap-2 rounded px-2 py-1 ${secretsMatch ? 'bg-status-success/10 text-status-success' : 'bg-status-error/10 text-status-error'}`}
            >
              {secretsMatch ? <CheckCircle size={13} /> : <XCircle size={13} />}
              {secretsMatch ? 'Shared secrets match — KEM successful' : 'Mismatch — secrets differ'}
            </div>
          )}
        </div>

        {kemError && <ErrorAlert message={kemError} />}
      </div>
    </div>
  )
}

// ── Software KEM Tab ──────────────────────────────────────────────────────────

export const KemOpsTab: React.FC = () => {
  const { hsmMode } = useSettingsContext()
  if (hsmMode) return <HsmKemPanel />

  return <KemOpsTabSoftware />
}

const KemOpsTabSoftware: React.FC = () => {
  const { loading } = useSettingsContext()
  const { keyStore, selectedEncKeyId, setSelectedEncKeyId, selectedDecKeyId, setSelectedDecKeyId } =
    useKeyStoreContext()
  const {
    runOperation,
    sharedSecret,
    setSharedSecret,
    ciphertext,
    setCiphertext,
    encryptedData,
    setEncryptedData,
    decryptedData,
    setDecryptedData,
    dataToEncrypt,
    setDataToEncrypt,
    kemDecapsulationResult,
    decapsulatedSecret,
    isHybridMode,
    setIsHybridMode,
    secondaryEncKeyId,
    setSecondaryEncKeyId,
    secondaryDecKeyId,
    setSecondaryDecKeyId,
    hybridMethod,
    setHybridMethod,
    pqcSharedSecret,
    classicalSharedSecret,
    pqcRecoveredSecret,
    classicalRecoveredSecret,
  } = useOperationsContext()

  const isKEM = (algo: string) =>
    algo.startsWith('ML-KEM') ||
    algo.startsWith('HQC') ||
    algo.startsWith('FrodoKEM') ||
    algo.startsWith('Classic-McEliece') ||
    ['X25519', 'X448', 'P-256', 'P-384', 'P-521', 'DH-2048'].includes(algo)

  const isClassical = (algo: string) =>
    ['X25519', 'X448', 'P-256', 'P-384', 'P-521', 'DH-2048'].includes(algo)
  const isPQC = (algo: string) => isKEM(algo) && !isClassical(algo)

  const kemPublicKeys = keyStore.filter((k) => k.type === 'public' && isKEM(k.algorithm))
  const kemPrivateKeys = keyStore.filter((k) => k.type === 'private' && isKEM(k.algorithm))

  const pqcPublicKeys = kemPublicKeys.filter((k) => isPQC(k.algorithm))
  const classicalPublicKeys = kemPublicKeys.filter((k) => isClassical(k.algorithm))

  const pqcPrivateKeys = kemPrivateKeys.filter((k) => isPQC(k.algorithm))
  const classicalPrivateKeys = kemPrivateKeys.filter((k) => isClassical(k.algorithm))

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-8">
      {/* Section 1: Key Encapsulation */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 mb-6 gap-4">
          <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Activity size={18} className="text-accent" /> Key Encapsulation Mechanism (KEM)
          </h4>

          {/* Key Derivation Method Selector - Always visible */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Key Derivation:
            </span>
            <FilterDropdown
              selectedId={hybridMethod}
              onSelect={(id) => setHybridMethod(id as 'concat-hkdf' | 'concat')}
              items={[
                { id: 'concat-hkdf', label: 'HKDF-Extract (Normalized)' },
                { id: 'concat', label: 'Raw (No Normalization)' },
              ]}
              defaultLabel="HKDF-Extract (Normalized)"
              noContainer
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* ========== ENCAPSULATE COLUMN ========== */}
          <div className="p-6 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors flex flex-col">
            {/* Header */}
            <div className="text-sm text-primary mb-6 font-bold uppercase tracking-wider flex items-center gap-2 border-b border-border/50 pb-2">
              <Lock size={16} /> 1. Encapsulate
            </div>

            {/* Step 1: Select Keys */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Step 1: Select Keys
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hybrid-mode-check-enc"
                    checked={isHybridMode}
                    onChange={(e) => {
                      setIsHybridMode(e.target.checked)
                      if (!e.target.checked) {
                        setSecondaryEncKeyId('')
                        setSecondaryDecKeyId('')
                      }
                    }}
                    className="rounded border-primary/50 text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  <label
                    htmlFor="hybrid-mode-check-enc"
                    className="text-xs font-medium cursor-pointer select-none"
                  >
                    Hybrid Mode
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground mb-1 block">
                    {isHybridMode ? 'Primary Public Key (PQC)' : 'Public Key'}
                  </span>
                  <FilterDropdown
                    selectedId={selectedEncKeyId || 'All'}
                    onSelect={(id) => setSelectedEncKeyId(id === 'All' ? '' : id)}
                    items={(isHybridMode ? pqcPublicKeys : kemPublicKeys).map((k) => ({
                      id: k.id,
                      label: k.name,
                    }))}
                    defaultLabel="Select Key..."
                    noContainer
                  />
                </div>

                {isHybridMode && (
                  <div>
                    <span className="text-xs text-muted-foreground mb-1 block">
                      Secondary Public Key (Classical)
                    </span>
                    <FilterDropdown
                      selectedId={secondaryEncKeyId || 'All'}
                      onSelect={(id) => setSecondaryEncKeyId(id === 'All' ? '' : id)}
                      items={classicalPublicKeys.map((k) => ({ id: k.id, label: k.name }))}
                      defaultLabel="Select Key..."
                      noContainer
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Run Operation */}
            <div className="mb-6">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Step 2: Run Operation
              </div>
              <button
                type="button"
                onClick={() => {
                  runOperation('encapsulate')
                  logEvent('Playground', 'KEM Encapsulate')
                }}
                disabled={!selectedEncKeyId || (isHybridMode && !secondaryEncKeyId) || loading}
                className="w-full py-3 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
              >
                Run Encapsulate
              </button>
            </div>

            {/* Step 3: Ciphertext Output */}
            <div className="mb-6 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Step 3: Ciphertext Output
              </div>
              {isHybridMode && ciphertext.includes('|') ? (
                // Hybrid mode: show separate PQC and Classical ciphertexts
                <>
                  <DataInput
                    label="PQC Ciphertext (ML-KEM)"
                    value={ciphertext.split('|')[0] || ''}
                    onChange={(val) => {
                      const parts = ciphertext.split('|')
                      setCiphertext(`${val}|${parts[1] || ''}`)
                    }}
                    inputType="binary"
                    placeholder="PQC Ciphertext..."
                    height="h-16"
                  />
                  <DataInput
                    label="Classical Ciphertext (Ephemeral PK)"
                    value={ciphertext.split('|')[1] || ''}
                    onChange={(val) => {
                      const parts = ciphertext.split('|')
                      setCiphertext(`${parts[0] || ''}|${val}`)
                    }}
                    inputType="binary"
                    placeholder="Classical Ciphertext..."
                    height="h-16"
                  />
                </>
              ) : (
                // Non-hybrid mode: single ciphertext
                <DataInput
                  label="Ciphertext (Send to Receiver)"
                  value={ciphertext}
                  onChange={setCiphertext}
                  inputType="binary"
                  placeholder="Generated Ciphertext..."
                  height="h-16"
                />
              )}
            </div>

            {/* Step 4: Shared Secrets */}
            {isHybridMode && (
              <div className="mb-6 pt-4 border-t border-dashed border-primary/20">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Step 4A: Raw Secrets (Internal)
                </div>
                <div className="space-y-3 mb-4">
                  <DataInput
                    label="PQC Shared Secret (Raw)"
                    value={pqcSharedSecret}
                    onChange={() => {}}
                    inputType="binary"
                    readOnly
                    placeholder="Pending..."
                    height="h-14"
                  />
                  <DataInput
                    label="Classical Shared Secret (Raw)"
                    value={classicalSharedSecret}
                    onChange={() => {}}
                    inputType="binary"
                    readOnly
                    placeholder="Pending..."
                    height="h-14"
                  />
                </div>
              </div>
            )}

            {/* Step 4B/5: Final Derived Secret */}
            <div className="space-y-4 mt-auto">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Step {isHybridMode ? '4B' : '4'}: Final Derived Secret
              </div>

              {/* Raw Shared Secret(s) - before normalization (hybrid only) */}
              {isHybridMode && (pqcSharedSecret || classicalSharedSecret) ? (
                <>
                  <div className="text-xs text-muted-foreground italic mt-2 mb-1">
                    Raw Secrets (before normalization):
                  </div>
                  <DataInput
                    label="PQC Shared Secret (Raw)"
                    value={pqcSharedSecret}
                    onChange={() => {}}
                    inputType="binary"
                    placeholder="PQC Secret..."
                    height="h-12"
                    readOnly
                  />
                  <DataInput
                    label="Classical Shared Secret (Raw)"
                    value={classicalSharedSecret}
                    onChange={() => {}}
                    inputType="binary"
                    placeholder="Classical Secret..."
                    height="h-12"
                    readOnly
                  />
                </>
              ) : null}

              {/* Normalization Indicator */}
              {isHybridMode && hybridMethod === 'concat-hkdf' && sharedSecret && (
                <div className="border border-dashed border-primary/20 rounded p-3 bg-primary/5 text-center space-y-2">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    Combination Process
                  </div>
                  <div className="flex flex-col items-center gap-1 text-xs">
                    <div className="flex gap-2">
                      <span className="bg-background border rounded px-1.5 py-0.5 text-muted-foreground">
                        Classical
                      </span>
                      <span className="text-primary font-bold">+</span>
                      <span className="bg-background border rounded px-1.5 py-0.5 text-muted-foreground">
                        PQC
                      </span>
                    </div>
                    <div className="text-primary/50">↓</div>
                    <div className="font-mono bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20 text-[10px] font-bold">
                      HKDF-Extract (SHA-256)
                    </div>
                  </div>
                </div>
              )}
              {!isHybridMode && hybridMethod === 'concat-hkdf' && sharedSecret && (
                <div className="text-xs bg-accent/10 border border-accent/30 rounded px-3 py-2 flex items-center gap-2">
                  <Activity size={14} className="text-accent" />
                  <span className="text-muted-foreground">HKDF-Extract (SHA-256) applied</span>
                </div>
              )}

              {/* Final Derived Secret */}
              <DataInput
                label={
                  isHybridMode
                    ? 'Final Derived Secret (Hybrid + HKDF)'
                    : hybridMethod === 'concat-hkdf'
                      ? 'Derived Secret (HKDF Normalized)'
                      : 'Shared Secret (Raw)'
                }
                value={sharedSecret}
                onChange={setSharedSecret}
                inputType="binary"
                placeholder="Key Material..."
                height="h-16"
              />
            </div>
          </div>

          {/* ========== DECAPSULATE COLUMN ========== */}
          <div className="p-6 bg-card rounded-xl border border-border hover:border-accent/30 transition-colors flex flex-col">
            {/* Header */}
            <div className="text-sm text-accent mb-6 font-bold uppercase tracking-wider flex items-center gap-2 border-b border-border/50 pb-2">
              <KeyIcon size={16} /> 2. Decapsulate
            </div>

            {/* Step 1: Select Keys */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Step 1: Select Keys
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hybrid-mode-check-dec"
                    checked={isHybridMode}
                    onChange={(e) => {
                      setIsHybridMode(e.target.checked)
                      if (!e.target.checked) {
                        setSecondaryEncKeyId('')
                        setSecondaryDecKeyId('')
                      }
                    }}
                    className="rounded border-accent/50 text-accent focus:ring-accent h-3.5 w-3.5"
                  />
                  <label
                    htmlFor="hybrid-mode-check-dec"
                    className="text-xs font-medium cursor-pointer select-none"
                  >
                    Hybrid Mode
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground mb-1 block">
                    {isHybridMode ? 'Primary Private Key (PQC)' : 'Private Key'}
                  </span>
                  <FilterDropdown
                    selectedId={selectedDecKeyId || 'All'}
                    onSelect={(id) => setSelectedDecKeyId(id === 'All' ? '' : id)}
                    items={(isHybridMode ? pqcPrivateKeys : kemPrivateKeys).map((k) => ({
                      id: k.id,
                      label: k.name,
                    }))}
                    defaultLabel="Select Key..."
                    noContainer
                  />
                </div>

                {isHybridMode && (
                  <div>
                    <span className="text-xs text-muted-foreground mb-1 block">
                      Secondary Private Key (Classical)
                    </span>
                    <FilterDropdown
                      selectedId={secondaryDecKeyId || 'All'}
                      onSelect={(id) => setSecondaryDecKeyId(id === 'All' ? '' : id)}
                      items={classicalPrivateKeys.map((k) => ({ id: k.id, label: k.name }))}
                      defaultLabel="Select Key..."
                      noContainer
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Run Operation */}
            <div className="mb-6">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Step 2: Run Operation
              </div>
              <button
                type="button"
                onClick={() => {
                  runOperation('decapsulate')
                  logEvent('Playground', 'KEM Decapsulate')
                }}
                disabled={!selectedDecKeyId || (isHybridMode && !secondaryDecKeyId) || loading}
                className="w-full py-3 rounded-lg bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
              >
                Run Decapsulate
              </button>
            </div>

            {/* Step 3: Ciphertext Input */}
            <div className="mb-6 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Step 3: Ciphertext Input
              </div>
              {isHybridMode && ciphertext.includes('|') ? (
                // Hybrid mode: show separate PQC and Classical ciphertexts
                <>
                  <DataInput
                    label="PQC Ciphertext (Input)"
                    value={ciphertext.split('|')[0] || ''}
                    onChange={(val) => {
                      const parts = ciphertext.split('|')
                      setCiphertext(`${val}|${parts[1] || ''}`)
                    }}
                    inputType="binary"
                    placeholder="Paste PQC ciphertext from left..."
                    height="h-16"
                  />
                  <DataInput
                    label="Classical Ciphertext (Input)"
                    value={ciphertext.split('|')[1] || ''}
                    onChange={(val) => {
                      const parts = ciphertext.split('|')
                      setCiphertext(`${parts[0] || ''}|${val}`)
                    }}
                    inputType="binary"
                    placeholder="Paste classical ciphertext from left..."
                    height="h-16"
                  />
                </>
              ) : (
                // Non-hybrid mode: single ciphertext
                <DataInput
                  label="Ciphertext (Input)"
                  value={ciphertext}
                  onChange={setCiphertext}
                  inputType="binary"
                  placeholder="Paste ciphertext from left..."
                  height="h-16"
                />
              )}
            </div>

            {/* Step 4A: Hybrid Secrets (Conditional) */}
            {isHybridMode && (pqcRecoveredSecret || classicalRecoveredSecret) && (
              <div className="mb-6 pt-4 border-t border-dashed border-accent/20">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Step 4A: Raw Secrets (Internal)
                </div>
                <div className="space-y-3 mb-4">
                  <DataInput
                    label="PQC Shared Secret (Raw)"
                    value={pqcRecoveredSecret}
                    onChange={() => {}}
                    inputType="binary"
                    readOnly
                    placeholder="Pending..."
                    height="h-14"
                  />
                  <DataInput
                    label="Classical Shared Secret (Raw)"
                    value={classicalRecoveredSecret}
                    onChange={() => {}}
                    inputType="binary"
                    readOnly
                    placeholder="Pending..."
                    height="h-14"
                  />
                </div>
              </div>
            )}

            {/* Step 4B: Final Derived Secret */}
            <div className="space-y-4 mt-auto">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Step {isHybridMode ? '4B' : '4'}: Final Derived Secret
              </div>

              {/* Raw Recovered Secret(s) - before normalization (hybrid only) */}
              {isHybridMode && (pqcRecoveredSecret || classicalRecoveredSecret) ? (
                <>
                  <div className="text-xs text-muted-foreground italic mt-2 mb-1">
                    Recovered Raw Secrets (before normalization):
                  </div>
                  <DataInput
                    label="PQC Shared Secret (Recovered)"
                    value={pqcRecoveredSecret}
                    onChange={() => {}}
                    inputType="binary"
                    placeholder="PQC Secret..."
                    height="h-12"
                    readOnly
                  />
                  <DataInput
                    label="Classical Shared Secret (Recovered)"
                    value={classicalRecoveredSecret}
                    onChange={() => {}}
                    inputType="binary"
                    placeholder="Classical Secret..."
                    height="h-12"
                    readOnly
                  />
                </>
              ) : null}

              {/* Normalization Indicator */}
              {isHybridMode && hybridMethod === 'concat-hkdf' && decapsulatedSecret && (
                <div className="border border-dashed border-accent/20 rounded p-3 bg-accent/5 text-center space-y-2">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    Combination Process
                  </div>
                  <div className="flex flex-col items-center gap-1 text-xs">
                    <div className="flex gap-2">
                      <span className="bg-background border rounded px-1.5 py-0.5 text-muted-foreground">
                        Classical
                      </span>
                      <span className="text-accent font-bold">+</span>
                      <span className="bg-background border rounded px-1.5 py-0.5 text-muted-foreground">
                        PQC
                      </span>
                    </div>
                    <div className="text-accent/50">↓</div>
                    <div className="font-mono bg-accent/10 text-accent px-2 py-1 rounded border border-accent/20 text-[10px] font-bold">
                      HKDF-Extract (SHA-256)
                    </div>
                  </div>
                </div>
              )}
              {!isHybridMode && hybridMethod === 'concat-hkdf' && decapsulatedSecret && (
                <div className="text-xs bg-accent/10 border border-accent/30 rounded px-3 py-2 flex items-center gap-2">
                  <Activity size={14} className="text-accent" />
                  <span className="text-muted-foreground">HKDF-Extract (SHA-256) applied</span>
                </div>
              )}

              {/* Final Derived Secret */}
              <DataInput
                label={
                  isHybridMode
                    ? 'Final Derived Secret (Hybrid + HKDF)'
                    : hybridMethod === 'concat-hkdf'
                      ? 'Derived Secret (HKDF Normalized)'
                      : 'Decapsulated Secret (Raw)'
                }
                value={decapsulatedSecret}
                onChange={() => {}}
                inputType="binary"
                placeholder="Click 'Run Decapsulate' above to recover secret..."
                height="h-16"
                readOnly
              />

              {/* Validation Result */}
              {kemDecapsulationResult !== null && (
                <div
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  className={`p-3 rounded-lg border flex items-center gap-3 ${
                    kemDecapsulationResult
                      ? 'bg-status-success/10 border-status-success/30 text-status-success'
                      : 'bg-status-error/10 border-status-error/30 text-status-error'
                  }`}
                >
                  {kemDecapsulationResult ? (
                    <CheckCircle size={20} aria-hidden="true" />
                  ) : (
                    <XCircle size={20} aria-hidden="true" />
                  )}
                  <div className="font-bold text-sm">
                    {kemDecapsulationResult ? '✓ MATCH' : '✗ MISMATCH'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Data Encryption/Decryption */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 mb-6 gap-2">
          <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Lock size={18} className="text-accent" /> Data Encryption (AES-GCM)
          </h4>
          <p className="text-xs text-muted-foreground italic">
            Use the shared secret from above as the encryption/decryption key
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Encrypt Data */}
          <div className="p-6 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors flex flex-col">
            <div className="text-sm text-primary mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
              <Lock size={16} /> Encrypt Message
            </div>

            <div className="space-y-4">
              <DataInput
                label="Message to Encrypt"
                value={dataToEncrypt}
                onChange={setDataToEncrypt}
                inputType="text"
                placeholder="Enter message to encrypt..."
                height="h-24"
              />
              <div>
                <DataInput
                  label="Shared Secret (Key)"
                  value={sharedSecret}
                  onChange={setSharedSecret}
                  inputType="binary"
                  placeholder="Run Encapsulate above to generate key..."
                  height="h-24"
                />
                {sharedSecret && (
                  <p className="text-xs text-success mt-1 flex items-center gap-1">
                    <CheckCircle size={12} /> Secret loaded - ready to encrypt
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  runOperation('encrypt')
                  logEvent('Playground', 'Hybrid Encrypt')
                }}
                disabled={!sharedSecret || loading}
                className="w-full py-3 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
              >
                Encrypt
              </button>
              <DataInput
                label="Encrypted Data (Output)"
                value={encryptedData}
                onChange={setEncryptedData}
                inputType="binary"
                placeholder="Resulting Ciphertext"
                height="h-24"
              />
            </div>
          </div>

          {/* Decrypt Data */}
          <div className="p-6 bg-card rounded-xl border border-border hover:border-accent/30 transition-colors flex flex-col">
            <div className="text-sm text-accent mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
              <KeyIcon size={16} /> Decrypt Message
            </div>

            <div className="space-y-4">
              <DataInput
                label="Encrypted Data (Input)"
                value={encryptedData}
                onChange={setEncryptedData}
                inputType="binary"
                placeholder="Paste encrypted data or encrypt on the left..."
                height="h-24"
              />
              <div>
                <DataInput
                  label="Shared Secret (Key)"
                  value={decapsulatedSecret || sharedSecret}
                  onChange={setSharedSecret}
                  inputType="binary"
                  placeholder="Run Decapsulate above to recover key..."
                  height="h-24"
                />
                {(decapsulatedSecret || sharedSecret) && (
                  <p className="text-xs text-success mt-1 flex items-center gap-1">
                    <CheckCircle size={12} /> Secret loaded - ready to decrypt
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  runOperation('decrypt')
                  logEvent('Playground', 'Hybrid Decrypt')
                }}
                disabled={!encryptedData || loading}
                className="w-full py-3 rounded-lg bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
              >
                Decrypt
              </button>
              <DataInput
                label="Decrypted Data (Output)"
                value={decryptedData}
                onChange={setDecryptedData}
                inputType="binary"
                placeholder="Recovered Message"
                height="h-24"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
