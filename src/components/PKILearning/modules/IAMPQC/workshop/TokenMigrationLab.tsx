// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useRef } from 'react'
import { Play, AlertTriangle, CheckCircle2, TrendingUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { SIGNATURE_SIZE_DATA, type SigningAlgorithm } from '../data/iamConstants'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import {
  hsm_generateMLDSAKeyPair,
  hsm_generateECKeyPair,
  hsm_generateRSAKeyPair,
  hsm_sign,
  hsm_ecdsaSign,
  hsm_rsaSign,
  CKM_SHA256_RSA_PKCS,
  CKM_ECDSA_SHA256,
} from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'

const ALGORITHM_OPTIONS = Object.entries(SIGNATURE_SIZE_DATA).map(([id, data]) => ({
  id,
  label: data.label,
}))

const JWT_HEADER_CLASSICAL_RS256 = `{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "rsa-2048-key-001"
}`

const JWT_HEADER_ES256 = `{
  "alg": "ES256",
  "typ": "JWT",
  "kid": "p256-key-001"
}`

const JWT_HEADER_MLDSA44 = `{
  "alg": "ML-DSA-44",
  "typ": "JWT",
  "kid": "ml-dsa-44-key-001"
}`

const JWT_HEADER_MLDSA65 = `{
  "alg": "ML-DSA-65",
  "typ": "JWT",
  "kid": "ml-dsa-65-key-001"
}`

const JWT_HEADER_MLDSA87 = `{
  "alg": "ML-DSA-87",
  "typ": "JWT",
  "kid": "ml-dsa-87-key-001"
}`

const JWT_HEADERS: Record<SigningAlgorithm, string> = {
  RS256: JWT_HEADER_CLASSICAL_RS256,
  ES256: JWT_HEADER_ES256,
  'ML-DSA-44': JWT_HEADER_MLDSA44,
  'ML-DSA-65': JWT_HEADER_MLDSA65,
  'ML-DSA-87': JWT_HEADER_MLDSA87,
}

const JWT_PAYLOAD = `{
  "sub": "user-1234",
  "name": "Alice Engineer",
  "email": "alice@corp.example",
  "roles": ["developer", "ci-pipeline"],
  "iat": 1741392000,
  "exp": 1741395600,
  "iss": "https://auth.corp.example",
  "aud": "https://api.corp.example"
}`

const MOCK_SIGNATURES: Record<SigningAlgorithm, string> = {
  RS256: 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c...[RSA-2048 signature, 256 bytes total]',
  ES256: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk...[ECDSA P-256 signature, 64 bytes total]',
  'ML-DSA-44':
    'zDtaWbLm8P3vK9nQeYfJcXsRuGhAiBoTkCdEmFgHjIlN...[ML-DSA-44 signature, 2420 bytes total — ~38x vs ES256]',
  'ML-DSA-65':
    'pQ7rSvYwZnMuKoXlTbEcFdGhIjJkLmNoPqRsTuVwXyZa...[ML-DSA-65 signature, 3309 bytes total — ~13x vs RS256]',
  'ML-DSA-87':
    'aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7...[ML-DSA-87 signature, 4627 bytes total — ~18x vs RS256]',
}

const ALGORITHM_NOTES: Record<SigningAlgorithm, string> = {
  RS256:
    "RSA PKCS#1 v1.5 with SHA-256. Widely supported but quantum-vulnerable. Shor's algorithm breaks 2048-bit RSA. Must be migrated before CRQC availability.",
  ES256:
    "ECDSA with P-256 curve. Smaller signature than RSA but still quantum-vulnerable via Shor's algorithm. Compact token format may be impacted by ML-DSA signature size increase.",
  'ML-DSA-44':
    'FIPS 204 NIST Level 2. Suitable for short-lived tokens (OAuth2 access tokens ≤1h). Signature is 38x larger than ES256 — evaluate HTTP header size limits in your infrastructure.',
  'ML-DSA-65':
    'FIPS 204 NIST Level 3. Recommended for most enterprise IAM token signing. Balances security and performance. 13x RSA-2048 signature size — monitor Bearer token header sizes.',
  'ML-DSA-87':
    'FIPS 204 NIST Level 5. For highest security requirements (government, NSS). Largest signature — evaluate HTTP/2 header compression and CDN configuration before deploying.',
}

const LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_GetAttributeValue',
  'C_MessageSignInit',
  'C_SignMessage',
  'C_MessageSignFinal',
  'C_SignInit',
  'C_Sign',
]

/** Convert byte array to hex */
const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

/** Base64url encode a string */
const base64url = (s: string): string =>
  btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

/** Key handle cache for multi-algorithm comparison */
interface KeyCache {
  pubHandle: number
  privHandle: number
}

export const TokenMigrationLab: React.FC = () => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<SigningAlgorithm>('RS256')
  const [signed, setSigned] = useState(false)
  const [signing, setSigning] = useState(false)
  const [liveSignatureHex, setLiveSignatureHex] = useState<string | null>(null)
  const [liveSignatureBytes, setLiveSignatureBytes] = useState<number | null>(null)

  // Live HSM state
  const hsm = useHSM()
  const keyCacheRef = useRef<Partial<Record<SigningAlgorithm, KeyCache>>>({})

  const algoData = SIGNATURE_SIZE_DATA[selectedAlgorithm]
  const isQuantumSafe = selectedAlgorithm.startsWith('ML-DSA')
  const isLive = hsm.isReady && !!hsm.moduleRef.current

  const handleAlgorithmSelect = (id: string) => {
    if (id === 'All') return
    setSelectedAlgorithm(id as SigningAlgorithm)
    setSigned(false)
    setLiveSignatureHex(null)
    setLiveSignatureBytes(null)
  }

  /** Generate or retrieve cached key pair for the selected algorithm */
  const getOrGenerateKey = useCallback(
    async (algo: SigningAlgorithm): Promise<KeyCache | null> => {
      if (!hsm.isReady || !hsm.moduleRef.current) return null
      const cached = keyCacheRef.current[algo]
      if (cached) return cached

      const M = hsm.moduleRef.current as unknown as SoftHSMModule
      const hSession = hsm.hSessionRef.current

      let result: KeyCache
      if (algo === 'RS256') {
        const { pubHandle, privHandle } = hsm_generateRSAKeyPair(M, hSession, 2048)
        result = { pubHandle, privHandle }
      } else if (algo === 'ES256') {
        const { pubHandle, privHandle } = hsm_generateECKeyPair(M, hSession, 'P-256')
        result = { pubHandle, privHandle }
      } else if (algo === 'ML-DSA-44') {
        const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(M, hSession, 44)
        result = { pubHandle, privHandle }
      } else if (algo === 'ML-DSA-65') {
        const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(M, hSession, 65)
        result = { pubHandle, privHandle }
      } else {
        const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(M, hSession, 87)
        result = { pubHandle, privHandle }
      }

      keyCacheRef.current[algo] = result
      return result
    },
    [hsm]
  )

  const handleSign = useCallback(async () => {
    setSigning(true)
    setSigned(false)
    setLiveSignatureHex(null)
    setLiveSignatureBytes(null)

    if (isLive) {
      try {
        const keys = await getOrGenerateKey(selectedAlgorithm)
        if (!keys) throw new Error('Key generation failed')

        const M = hsm.moduleRef.current as unknown as SoftHSMModule
        const hSession = hsm.hSessionRef.current
        const { privHandle } = keys

        // Build JWT signing input: base64url(header).base64url(payload)
        const signingInput = `${base64url(JWT_HEADERS[selectedAlgorithm])}.${base64url(JWT_PAYLOAD)}`

        let sig: Uint8Array
        if (selectedAlgorithm === 'RS256') {
          sig = hsm_rsaSign(M, hSession, privHandle, signingInput, CKM_SHA256_RSA_PKCS)
        } else if (selectedAlgorithm === 'ES256') {
          sig = hsm_ecdsaSign(M, hSession, privHandle, signingInput, CKM_ECDSA_SHA256)
        } else {
          // ML-DSA variants use message signing (hsm_sign)
          sig = hsm_sign(M, hSession, privHandle, signingInput)
        }

        setLiveSignatureHex(toHex(sig))
        setLiveSignatureBytes(sig.length)
        setSigned(true)
      } catch (err) {
        console.error('[TokenMigrationLab] live sign error:', err)
        // Fall back to mock on error
        const delay = algoData.timingMs * 10 + Math.random() * 5
        await new Promise((resolve) => setTimeout(resolve, delay))
        setSigned(true)
      }
    } else {
      const delay = algoData.timingMs * 10 + Math.random() * 5
      await new Promise((resolve) => setTimeout(resolve, delay))
      setSigned(true)
    }
    setSigning(false)
  }, [selectedAlgorithm, algoData, isLive, hsm, getOrGenerateKey])

  const displayedSigBytes = liveSignatureBytes ?? algoData.bytes
  const displayedSigHex = liveSignatureHex ?? (signed ? MOCK_SIGNATURES[selectedAlgorithm] : null)

  const rs256Size = SIGNATURE_SIZE_DATA.RS256.bytes
  const sizeRatio = (displayedSigBytes / rs256Size).toFixed(1)

  const tokenSizeEstimate = {
    header: JWT_HEADERS[selectedAlgorithm].length,
    payload: JWT_PAYLOAD.length,
    signature: displayedSigBytes,
    total:
      Math.round((JWT_HEADERS[selectedAlgorithm].length + JWT_PAYLOAD.length) * 1.4) +
      displayedSigBytes,
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Token Signing Migration Lab</h3>
        <p className="text-sm text-muted-foreground">
          Compare JWT signing algorithms side-by-side. Toggle between classical RS256/ES256 and
          quantum-safe ML-DSA variants to observe signature size impact and header changes.
        </p>
      </div>

      {/* Live HSM Toggle */}
      <LiveHSMToggle hsm={hsm} operations={LIVE_OPERATIONS} />

      {/* Algorithm Selector */}
      <div className="glass-panel p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="text-sm font-bold text-foreground mb-1">Signing Algorithm</div>
            <p className="text-xs text-muted-foreground">
              Select algorithm to see header changes and signature size impact
            </p>
          </div>
          <FilterDropdown
            items={ALGORITHM_OPTIONS}
            selectedId={selectedAlgorithm}
            onSelect={handleAlgorithmSelect}
            label="Algorithm"
            defaultLabel="Select Algorithm"
            noContainer
          />
        </div>

        {/* Status Badge */}
        <div className="mt-4 flex items-center gap-3">
          {isQuantumSafe ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-status-success/10 border border-status-success/30">
              <CheckCircle2 size={14} className="text-status-success" aria-hidden="true" />
              <span className="text-xs font-bold text-status-success">Quantum-Safe (FIPS 204)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-status-error/10 border border-status-error/30">
              <AlertTriangle size={14} className="text-status-error" aria-hidden="true" />
              <span className="text-xs font-bold text-status-error">Quantum-Vulnerable</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground">{ALGORITHM_NOTES[selectedAlgorithm]}</div>
        </div>
      </div>

      {/* JWT Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Header Panel */}
        <div className="glass-panel p-4">
          <div className="text-xs font-bold text-primary mb-2 uppercase tracking-wide">
            Header (alg field)
          </div>
          <pre className="text-[10px] font-mono text-foreground bg-muted/50 rounded p-3 border border-border overflow-x-auto whitespace-pre">
            {JWT_HEADERS[selectedAlgorithm]}
          </pre>
          <div className="mt-2 text-[10px] text-muted-foreground">
            The <code className="text-primary">alg</code> field must match the signing key type. JWK
            Set endpoint must expose the corresponding PQC public key.
          </div>
        </div>

        {/* Payload Panel */}
        <div className="glass-panel p-4">
          <div className="text-xs font-bold text-secondary mb-2 uppercase tracking-wide">
            Payload (unchanged)
          </div>
          <pre className="text-[10px] font-mono text-muted-foreground bg-muted/50 rounded p-3 border border-border overflow-x-auto whitespace-pre">
            {JWT_PAYLOAD}
          </pre>
          <div className="mt-2 text-[10px] text-muted-foreground">
            The payload is algorithm-agnostic. No changes needed when migrating signing algorithm.
          </div>
        </div>

        {/* Signature Panel */}
        <div className="glass-panel p-4">
          <div
            className={`text-xs font-bold mb-2 uppercase tracking-wide ${isQuantumSafe ? 'text-status-success' : 'text-status-error'}`}
          >
            Signature ({displayedSigBytes.toLocaleString()} bytes)
          </div>
          {signed && displayedSigHex ? (
            <>
              <pre
                className={`text-[10px] font-mono bg-muted/50 rounded p-3 border overflow-x-auto whitespace-pre-wrap break-all ${isQuantumSafe ? 'text-status-success border-status-success/30' : 'text-status-error border-status-error/30'}`}
              >
                {liveSignatureHex
                  ? `${liveSignatureHex.slice(0, 80)}...${liveSignatureHex.slice(-20)}`
                  : displayedSigHex}
              </pre>
              <div className="mt-2 flex items-center gap-2">
                <CheckCircle2 size={12} className="text-status-success" aria-hidden="true" />
                <span className="text-[10px] text-status-success font-medium">
                  {liveSignatureHex
                    ? `Signed via PKCS#11 v3.2 — ${displayedSigBytes.toLocaleString()} bytes`
                    : `Signed in ~${algoData.timingMs}ms`}
                </span>
              </div>
            </>
          ) : (
            <div className="bg-muted/30 rounded p-3 border border-border min-h-[80px] flex items-center justify-center">
              <span className="text-xs text-muted-foreground italic">
                {signing ? 'Signing...' : 'Click "Sign Token" to generate signature'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sign Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSign}
          disabled={signing}
          variant="gradient"
          className="flex items-center gap-2"
        >
          {signing ? (
            <>
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              Signing...
            </>
          ) : (
            <>
              <Play size={14} fill="currentColor" aria-hidden="true" />
              {isLive ? 'Sign Token (Live WASM)' : 'Sign Token'}
            </>
          )}
        </Button>
      </div>

      {/* PKCS#11 Call Log */}
      {hsm.isReady && hsm.log.length > 0 && (
        <Pkcs11LogPanel
          log={hsm.log}
          onClear={hsm.clearLog}
          title="PKCS#11 Call Log"
          defaultOpen={false}
          filterFns={LIVE_OPERATIONS}
        />
      )}

      {/* Size Impact Analysis */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-primary" aria-hidden="true" />
          <h4 className="text-sm font-bold text-foreground">Size Impact Analysis</h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-xl font-bold text-foreground">
              {displayedSigBytes.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">Signature bytes</div>
          </div>
          <div
            className={`rounded-lg p-3 border text-center ${parseFloat(sizeRatio) > 1 ? 'bg-warning/5 border-warning/20' : 'bg-status-success/5 border-status-success/20'}`}
          >
            <div
              className={`text-xl font-bold ${parseFloat(sizeRatio) > 1 ? 'text-warning' : 'text-status-success'}`}
            >
              {sizeRatio}x
            </div>
            <div className="text-[10px] text-muted-foreground">vs RS256 (256B)</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-xl font-bold text-foreground">{algoData.timingMs}ms</div>
            <div className="text-[10px] text-muted-foreground">Signing time (est.)</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-xl font-bold text-foreground">
              ~{tokenSizeEstimate.total.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">Total token bytes</div>
          </div>
        </div>

        {/* Comparison Bar */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-foreground mb-2">Signature Size Comparison</div>
          {Object.entries(SIGNATURE_SIZE_DATA).map(([id, data]) => {
            const maxBytes = SIGNATURE_SIZE_DATA['ML-DSA-87'].bytes
            const widthPct = (data.bytes / maxBytes) * 100
            const isActive = id === selectedAlgorithm
            return (
              <div key={id} className="flex items-center gap-3">
                <div className="text-[10px] text-muted-foreground w-24 shrink-0 text-right">
                  {id}
                </div>
                <div className="flex-1 bg-muted/50 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isActive
                        ? id.startsWith('ML-DSA')
                          ? 'bg-status-success'
                          : 'bg-status-error'
                        : 'bg-border'
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <div
                  className={`text-[10px] w-14 shrink-0 font-mono ${isActive ? (id.startsWith('ML-DSA') ? 'text-status-success font-bold' : 'text-status-error font-bold') : 'text-muted-foreground'}`}
                >
                  {data.bytes.toLocaleString()}B
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 bg-muted/50 rounded-lg p-3 border border-border">
          <div className="text-xs font-bold text-foreground mb-1">
            Infrastructure Considerations
          </div>
          <ul className="text-[10px] text-muted-foreground space-y-1">
            <li>
              &bull; HTTP Authorization header limit (8KB default in Nginx): ML-DSA-87 tokens may
              require header size increase
            </li>
            <li>
              &bull; Cookie size limit (4KB): Bearer tokens in cookies must use ML-DSA-44 or switch
              to short-lived opaque tokens
            </li>
            <li>
              &bull; Load balancer JWT validation: Envoy, Kong, AWS ALB must update JWT algorithms
              allow-list to include ML-DSA variants
            </li>
            <li>
              &bull; Client SDK updates: JOSE/JWT libraries (jose, jsonwebtoken, PyJWT) need PQC
              algorithm support — check vendor roadmaps
            </li>
          </ul>
        </div>
      </div>

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong>{' '}
          {isLive
            ? 'All signing operations execute in SoftHSM3 WASM — a reference PKCS#11 v3.2 implementation. Real key pairs are generated and cached per algorithm. Signature sizes match the actual FIPS 204 / PKCS#1 / ECDSA specifications.'
            : 'In simulation mode, signature data is representative. Enable Live WASM mode to execute real PKCS#11 v3.2 signing operations across all five algorithms.'}{' '}
          Generated keys are for educational purposes only.
        </p>
      </div>
    </div>
  )
}
