// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useRef } from 'react'
import { Loader2, CheckCircle, XCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  hsm_generateSLHDSAKeyPair,
  hsm_slhdsaSign,
  hsm_slhdsaVerify,
  hsm_extractKeyValue,
  CKP_SLH_DSA_SHA2_128S,
  CKP_SLH_DSA_SHAKE_128S,
  CKP_SLH_DSA_SHA2_128F,
  CKP_SLH_DSA_SHAKE_128F,
  CKP_SLH_DSA_SHA2_192S,
  CKP_SLH_DSA_SHAKE_192S,
  CKP_SLH_DSA_SHA2_192F,
  CKP_SLH_DSA_SHAKE_192F,
  CKP_SLH_DSA_SHA2_256S,
  CKP_SLH_DSA_SHAKE_256S,
  CKP_SLH_DSA_SHA2_256F,
  CKP_SLH_DSA_SHAKE_256F,
  type SLHDSAPreHash,
} from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'

// ── SLH-DSA parameter set data (FIPS 205 / PKCS#11 v3.2) ──────────────────

interface ParamSet {
  id: string
  label: string
  ckp: number
  nistLevel: number
  hash: string
  pubBytes: number
  sigBytes: number
  category: 's' | 'f'
}

const PARAM_SETS: ParamSet[] = [
  {
    id: 'sha2-128s',
    label: 'SHA2-128s',
    ckp: CKP_SLH_DSA_SHA2_128S,
    nistLevel: 1,
    hash: 'SHA-256',
    pubBytes: 32,
    sigBytes: 7856,
    category: 's',
  },
  {
    id: 'shake-128s',
    label: 'SHAKE-128s',
    ckp: CKP_SLH_DSA_SHAKE_128S,
    nistLevel: 1,
    hash: 'SHAKE-128',
    pubBytes: 32,
    sigBytes: 7856,
    category: 's',
  },
  {
    id: 'sha2-128f',
    label: 'SHA2-128f',
    ckp: CKP_SLH_DSA_SHA2_128F,
    nistLevel: 1,
    hash: 'SHA-256',
    pubBytes: 32,
    sigBytes: 17088,
    category: 'f',
  },
  {
    id: 'shake-128f',
    label: 'SHAKE-128f',
    ckp: CKP_SLH_DSA_SHAKE_128F,
    nistLevel: 1,
    hash: 'SHAKE-128',
    pubBytes: 32,
    sigBytes: 17088,
    category: 'f',
  },
  {
    id: 'sha2-192s',
    label: 'SHA2-192s',
    ckp: CKP_SLH_DSA_SHA2_192S,
    nistLevel: 3,
    hash: 'SHA-256',
    pubBytes: 48,
    sigBytes: 16224,
    category: 's',
  },
  {
    id: 'shake-192s',
    label: 'SHAKE-192s',
    ckp: CKP_SLH_DSA_SHAKE_192S,
    nistLevel: 3,
    hash: 'SHAKE-256',
    pubBytes: 48,
    sigBytes: 16224,
    category: 's',
  },
  {
    id: 'sha2-192f',
    label: 'SHA2-192f',
    ckp: CKP_SLH_DSA_SHA2_192F,
    nistLevel: 3,
    hash: 'SHA-256',
    pubBytes: 48,
    sigBytes: 35664,
    category: 'f',
  },
  {
    id: 'shake-192f',
    label: 'SHAKE-192f',
    ckp: CKP_SLH_DSA_SHAKE_192F,
    nistLevel: 3,
    hash: 'SHAKE-256',
    pubBytes: 48,
    sigBytes: 35664,
    category: 'f',
  },
  {
    id: 'sha2-256s',
    label: 'SHA2-256s',
    ckp: CKP_SLH_DSA_SHA2_256S,
    nistLevel: 5,
    hash: 'SHA-256',
    pubBytes: 64,
    sigBytes: 29792,
    category: 's',
  },
  {
    id: 'shake-256s',
    label: 'SHAKE-256s',
    ckp: CKP_SLH_DSA_SHAKE_256S,
    nistLevel: 5,
    hash: 'SHAKE-256',
    pubBytes: 64,
    sigBytes: 29792,
    category: 's',
  },
  {
    id: 'sha2-256f',
    label: 'SHA2-256f',
    ckp: CKP_SLH_DSA_SHA2_256F,
    nistLevel: 5,
    hash: 'SHA-256',
    pubBytes: 64,
    sigBytes: 49856,
    category: 'f',
  },
  {
    id: 'shake-256f',
    label: 'SHAKE-256f',
    ckp: CKP_SLH_DSA_SHAKE_256F,
    nistLevel: 5,
    hash: 'SHAKE-256',
    pubBytes: 64,
    sigBytes: 49856,
    category: 'f',
  },
]

const PREHASH_OPTIONS = [
  { id: 'sha256', label: 'SHA-256' },
  { id: 'sha384', label: 'SHA-384' },
  { id: 'sha512', label: 'SHA-512' },
  { id: 'sha3-256', label: 'SHA3-256' },
  { id: 'sha3-512', label: 'SHA3-512' },
  { id: 'shake128', label: 'SHAKE-128' },
  { id: 'shake256', label: 'SHAKE-256' },
]

const DROPDOWN_ITEMS = PARAM_SETS.map((p) => ({ id: p.id, label: p.label }))

const LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_GetAttributeValue',
  'C_MessageSignInit',
  'C_SignMessage',
  'C_MessageSignFinal',
  'C_MessageVerifyInit',
  'C_VerifyMessage',
  'C_MessageVerifyFinal',
]

// ── Comparison data: LMS vs SLH-DSA vs ML-DSA ──────────────────────────────

const COMPARISON_ROWS = [
  { label: 'Standard', lms: 'SP 800-208', slhdsa: 'FIPS 205', mldsa: 'FIPS 204' },
  { label: 'Basis', lms: 'Hash function', slhdsa: 'Hash function', mldsa: 'Lattice' },
  { label: 'Statefulness', lms: 'Stateful', slhdsa: 'Stateless', mldsa: 'Stateless' },
  { label: 'Max signatures', lms: 'Bounded (2^h)', slhdsa: 'Unlimited', mldsa: 'Unlimited' },
  { label: 'Pub key (L3)', lms: '60 B', slhdsa: '48 B', mldsa: '1,952 B' },
  { label: 'Signature (L3)', lms: '2,644 B', slhdsa: '16,224 B', mldsa: '3,309 B' },
  { label: 'Signing speed', lms: 'Fast', slhdsa: 'Slow', mldsa: 'Fast' },
  { label: 'CNSA 2.0', lms: 'Required', slhdsa: 'Not listed', mldsa: 'Required' },
  {
    label: 'Best use',
    lms: 'Firmware, code signing',
    slhdsa: 'General-purpose',
    mldsa: 'General-purpose',
  },
]

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

const formatBytes = (n: number): string => (n >= 1024 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`)

export const SLHDSALiveDemo: React.FC = () => {
  const hsm = useHSM()
  const isLive = hsm.isReady && !!hsm.moduleRef.current

  // Parameter set & pre-hash selection
  const [paramSetId, setParamSetId] = useState('sha2-128s')
  const [preHash, setPreHash] = useState('')
  const [message, setMessage] = useState('SLH-DSA test message for stateful signatures module')

  // Operation results
  const [keyHandles, setKeyHandles] = useState<{ pub: number; priv: number } | null>(null)
  const [pubKeyHex, setPubKeyHex] = useState<string | null>(null)
  const [signature, setSignature] = useState<Uint8Array | null>(null)
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  // Track pre-hash used during signing for verify consistency
  const signPreHashRef = useRef<string>('')

  const selectedParam = PARAM_SETS.find((p) => p.id === paramSetId) ?? PARAM_SETS[0]

  const resetResults = useCallback(() => {
    setKeyHandles(null)
    setPubKeyHex(null)
    setSignature(null)
    setVerifyResult(null)
    setError(null)
    signPreHashRef.current = ''
  }, [])

  const handleParamSetChange = useCallback(
    (id: string) => {
      setParamSetId(id)
      resetResults()
    },
    [resetResults]
  )

  const handleGenerateKey = useCallback(async () => {
    if (!hsm.isReady || !hsm.moduleRef.current) return
    setLoading('keygen')
    setError(null)
    setSignature(null)
    setVerifyResult(null)
    try {
      const M = hsm.moduleRef.current as unknown as SoftHSMModule
      const hSession = hsm.hSessionRef.current
      const { pubHandle, privHandle } = hsm_generateSLHDSAKeyPair(M, hSession, selectedParam.ckp)
      setKeyHandles({ pub: pubHandle, priv: privHandle })

      const pubBytes = hsm_extractKeyValue(M, hSession, pubHandle)
      setPubKeyHex(toHex(pubBytes))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
    setLoading(null)
  }, [hsm, selectedParam.ckp])

  const handleSign = useCallback(async () => {
    if (!hsm.isReady || !hsm.moduleRef.current || !keyHandles) return
    setLoading('sign')
    setError(null)
    setVerifyResult(null)
    try {
      const M = hsm.moduleRef.current as unknown as SoftHSMModule
      const hSession = hsm.hSessionRef.current
      const opts = preHash ? { preHash: preHash as SLHDSAPreHash } : undefined
      const sig = hsm_slhdsaSign(M, hSession, keyHandles.priv, message, opts)
      setSignature(sig)
      signPreHashRef.current = preHash
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
    setLoading(null)
  }, [hsm, keyHandles, message, preHash])

  const handleVerify = useCallback(async () => {
    if (!hsm.isReady || !hsm.moduleRef.current || !keyHandles || !signature) return
    setLoading('verify')
    setError(null)
    try {
      const M = hsm.moduleRef.current as unknown as SoftHSMModule
      const hSession = hsm.hSessionRef.current
      // Must use same pre-hash as signing
      const opts = signPreHashRef.current
        ? { preHash: signPreHashRef.current as SLHDSAPreHash }
        : undefined
      const ok = hsm_slhdsaVerify(M, hSession, keyHandles.pub, message, signature, opts)
      setVerifyResult(ok)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
    setLoading(null)
  }, [hsm, keyHandles, signature, message])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">SLH-DSA Live Demo (FIPS 205)</h3>
        <p className="text-sm text-muted-foreground">
          Generate SLH-DSA key pairs, sign messages, and verify signatures using a real PKCS#11 v3.2
          HSM emulator in-browser. Compare SLH-DSA (stateless) with the stateful LMS/XMSS schemes
          from Steps 1-3.
        </p>
      </div>

      {/* Live HSM Toggle */}
      <LiveHSMToggle hsm={hsm} operations={LIVE_OPERATIONS} />

      {isLive ? (
        <div className="space-y-5">
          {/* Parameter Set + Pre-hash Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Parameter Set (12 FIPS 205 variants)
              </label>
              <FilterDropdown
                items={DROPDOWN_ITEMS}
                selectedId={paramSetId}
                onSelect={handleParamSetChange}
                defaultLabel="Select parameter set"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Pre-hash (optional, default: Pure)
              </label>
              <FilterDropdown
                items={PREHASH_OPTIONS}
                selectedId={preHash || 'All'}
                onSelect={(id) => setPreHash(id === 'All' ? '' : id)}
                defaultLabel="Pure (no pre-hash)"
              />
            </div>
          </div>

          {/* Parameter Details */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block">Param set</span>
                <span className="font-mono font-bold text-primary">{selectedParam.label}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">NIST Level</span>
                <span className="font-bold text-foreground">{selectedParam.nistLevel}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Hash</span>
                <span className="font-mono text-foreground">{selectedParam.hash}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Public key</span>
                <span className="font-mono text-foreground">{selectedParam.pubBytes} B</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Signature</span>
                <span className="font-mono text-foreground">
                  {formatBytes(selectedParam.sigBytes)}
                </span>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">
              <strong>{selectedParam.category === 's' ? 'Small (s)' : 'Fast (f)'}:</strong>
              {selectedParam.category === 's'
                ? ' Optimized for smaller signatures — slower signing.'
                : ' Optimized for faster signing — larger signatures.'}
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Message to sign
            </label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message..."
              className="font-mono text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleGenerateKey}
              disabled={!!loading}
              variant="outline"
              className="text-sm"
            >
              {loading === 'keygen' ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1" /> Generating...
                </>
              ) : (
                '1. Generate Key Pair'
              )}
            </Button>
            <Button
              onClick={handleSign}
              disabled={!!loading || !keyHandles}
              variant="outline"
              className="text-sm"
            >
              {loading === 'sign' ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1" /> Signing...
                </>
              ) : (
                '2. Sign Message'
              )}
            </Button>
            <Button
              onClick={handleVerify}
              disabled={!!loading || !signature}
              variant="outline"
              className="text-sm"
            >
              {loading === 'verify' ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1" /> Verifying...
                </>
              ) : (
                '3. Verify Signature'
              )}
            </Button>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-status-error/10 border border-status-error/30 rounded-lg p-3 text-xs text-status-error">
              {error}
            </div>
          )}

          {/* Results */}
          {pubKeyHex && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-3">
              <div className="text-xs font-bold text-foreground">Public Key (CKA_VALUE)</div>
              <pre className="text-[10px] font-mono text-muted-foreground bg-background rounded p-2 border border-border overflow-x-auto whitespace-pre-wrap break-all">
                {pubKeyHex.length > 120
                  ? `${pubKeyHex.slice(0, 60)}...${pubKeyHex.slice(-60)}`
                  : pubKeyHex}
              </pre>
              <div className="text-[10px] text-muted-foreground">
                {(pubKeyHex.length / 2).toLocaleString()} bytes — extracted via C_GetAttributeValue.
                Private key is HSM-protected (CKA_EXTRACTABLE=FALSE).
              </div>
            </div>
          )}

          {signature && (
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-primary">
                  SLH-DSA Signature
                  {signPreHashRef.current ? ` (HashSLH-DSA-${signPreHashRef.current})` : ' (Pure)'}
                </div>
                <span className="text-xs font-mono text-primary">
                  {formatBytes(signature.length)}
                </span>
              </div>
              <pre className="text-[10px] font-mono text-primary/80 bg-background rounded p-2 border border-primary/20 overflow-x-auto whitespace-pre-wrap break-all">
                {toHex(signature).slice(0, 120)}...
              </pre>
            </div>
          )}

          {verifyResult !== null && (
            <div
              className={`flex items-center gap-2 rounded-lg p-3 border ${
                verifyResult
                  ? 'border-status-success/30 bg-status-success/10'
                  : 'border-status-error/30 bg-status-error/10'
              }`}
            >
              {verifyResult ? (
                <CheckCircle size={16} className="text-status-success" />
              ) : (
                <XCircle size={16} className="text-status-error" />
              )}
              <span
                className={`text-sm font-bold ${verifyResult ? 'text-status-success' : 'text-status-error'}`}
              >
                {verifyResult ? 'Signature Valid' : 'Signature Invalid'}
              </span>
            </div>
          )}

          {/* PKCS#11 Call Log */}
          {hsm.log.length > 0 && (
            <Pkcs11LogPanel
              log={hsm.log}
              onClear={hsm.clearLog}
              title="PKCS#11 Call Log"
              defaultOpen={false}
            />
          )}
        </div>
      ) : (
        <div className="bg-muted/50 rounded-lg p-6 border border-border text-center">
          <p className="text-sm text-muted-foreground">
            Enable <strong>Live WASM Mode</strong> above to generate real SLH-DSA keys, sign, and
            verify using the SoftHSM3 PKCS#11 v3.2 emulator.
          </p>
        </div>
      )}

      {/* Comparison Table: LMS vs SLH-DSA vs ML-DSA */}
      <div className="glass-panel p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} className="text-primary" aria-hidden="true" />
          <h4 className="text-sm font-bold text-foreground">
            Stateful vs Stateless Signature Comparison
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Property</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">LMS/HSS</th>
                <th className="text-center py-2 px-3 text-primary font-medium">SLH-DSA</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">ML-DSA</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-border/50">
                  <td className="py-2 pr-4 text-foreground font-medium">{row.label}</td>
                  <td className="py-2 px-3 text-center font-mono text-muted-foreground">
                    {row.lms}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-primary">{row.slhdsa}</td>
                  <td className="py-2 px-3 text-center font-mono text-muted-foreground">
                    {row.mldsa}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> SLH-DSA (FIPS 205, formerly SPHINCS+) uses hash-based Merkle trees
          like LMS/XMSS but eliminates state management entirely. The trade-off is significantly
          larger signatures (7-49 KB vs 1-9 KB). The &quot;s&quot; variants optimize for smaller
          signatures while &quot;f&quot; variants optimize for faster signing.{' '}
          {isLive
            ? 'All operations execute via SoftHSM3 PKCS#11 v3.2.'
            : 'Enable Live WASM mode for real cryptographic operations.'}{' '}
          Generated keys are for educational purposes only.
        </p>
      </div>
    </div>
  )
}
