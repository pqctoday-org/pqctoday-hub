// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useRef } from 'react'
import {
  Play,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Loader2,
  ShieldCheck,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { SIGNATURE_SIZE_DATA, type SigningAlgorithm } from '../data/iamConstants'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import {
  hsm_generateMLDSAKeyPair,
  hsm_generateECKeyPair,
  hsm_generateRSAKeyPair,
  hsm_sign,
  hsm_ecdsaSign,
  hsm_rsaSign,
  hsm_verify,
  hsm_ecdsaVerify,
  hsm_rsaVerify,
  CKM_SHA256_RSA_PKCS,
  CKM_ECDSA_SHA256,
} from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import type { HsmFamily } from '@/components/Playground/hsm/HsmContext'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'

const IAM_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'iam-oidc-sign',
    useCase: 'OIDC ID token signing (ML-DSA-65)',
    standard: 'OpenID Connect + FIPS 204',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/204/final',
    kind: { type: 'mldsa-functional', variant: 65 },
    message:
      '{"iss":"https://idp.example","sub":"user@example","aud":"api.example","exp":1735776000}',
  },
  {
    id: 'iam-saml-sigver',
    useCase: 'SAML assertion verification (ML-DSA-87)',
    standard: 'SAML 2.0 + FIPS 204 ACVP',
    referenceUrl:
      'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/ML-DSA-sigGen-FIPS204',
    kind: { type: 'mldsa-sigver', variant: 87 },
  },
  {
    id: 'iam-token-hmac',
    useCase: 'Session token HMAC integrity',
    standard: 'FIPS 198-1 ACVP',
    referenceUrl:
      'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/HMAC-SHA2-256',
    kind: { type: 'hmac-verify', hashAlg: 'SHA-256' },
  },
  {
    id: 'iam-token-hmac-gen',
    useCase: 'Session token HMAC generation',
    standard: 'FIPS 198-1',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/198-1/final',
    kind: { type: 'hmac-generate', hashAlg: 'SHA-256' },
  },
  {
    id: 'iam-password-pbkdf2',
    useCase: 'Password hash derivation (PBKDF2)',
    standard: 'NIST SP 800-132',
    referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/132/final',
    kind: { type: 'pbkdf2-derive', prf: 'SHA-256' },
  },
]

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

/** JWKS endpoint response example for each algorithm */
const JWKS_EXAMPLES: Record<SigningAlgorithm, string> = {
  RS256: `{
  "keys": [{
    "kty": "RSA",
    "alg": "RS256",
    "kid": "rsa-2048-key-001",
    "n": "sLjA...long modulus...",
    "e": "AQAB",
    "use": "sig"
  }]
}`,
  ES256: `{
  "keys": [{
    "kty": "EC",
    "alg": "ES256",
    "kid": "p256-key-001",
    "crv": "P-256",
    "x": "f83OJ3D2...",
    "y": "x_FEzRu9...",
    "use": "sig"
  }]
}`,
  'ML-DSA-44': `{
  "keys": [{
    "kty": "AKP",
    "alg": "ML-DSA-44",
    "kid": "ml-dsa-44-key-001",
    "pub": "<2592-byte ML-DSA-44 public key, base64url>",
    "use": "sig"
  }]
}`,
  'ML-DSA-65': `{
  "keys": [{
    "kty": "AKP",
    "alg": "ML-DSA-65",
    "kid": "ml-dsa-65-key-001",
    "pub": "<3872-byte ML-DSA-65 public key, base64url>",
    "use": "sig"
  }]
}`,
  'ML-DSA-87': `{
  "keys": [{
    "kty": "AKP",
    "alg": "ML-DSA-87",
    "kid": "ml-dsa-87-key-001",
    "pub": "<4864-byte ML-DSA-87 public key, base64url>",
    "use": "sig"
  }]
}`,
}

const LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_MessageSignInit',
  'C_SignMessage',
  'C_MessageSignFinal',
  'C_SignInit',
  'C_Sign',
  'C_MessageVerifyInit',
  'C_VerifyMessage',
  'C_MessageVerifyFinal',
  'C_VerifyInit',
  'C_Verify',
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
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)
  // Stores raw signature bytes from live signing for subsequent live verification
  const liveSigBytesRef = useRef<Uint8Array | null>(null)

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
    setVerifyResult(null)
    liveSigBytesRef.current = null
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
      let family: HsmFamily
      let labelSuffix = ''

      if (algo === 'RS256') {
        const { pubHandle, privHandle } = hsm_generateRSAKeyPair(M, hSession, 2048, false, 'sign')
        result = { pubHandle, privHandle }
        family = 'rsa'
        labelSuffix = 'RSA-2048'
      } else if (algo === 'ES256') {
        const { pubHandle, privHandle } = hsm_generateECKeyPair(M, hSession, 'P-256', false, 'sign')
        result = { pubHandle, privHandle }
        family = 'ecdsa'
        labelSuffix = 'P-256'
      } else if (algo === 'ML-DSA-44') {
        const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(M, hSession, 44)
        result = { pubHandle, privHandle }
        family = 'ml-dsa'
        labelSuffix = 'ML-DSA-44'
      } else if (algo === 'ML-DSA-65') {
        const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(M, hSession, 65)
        result = { pubHandle, privHandle }
        family = 'ml-dsa'
        labelSuffix = 'ML-DSA-65'
      } else {
        const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(M, hSession, 87)
        result = { pubHandle, privHandle }
        family = 'ml-dsa'
        labelSuffix = 'ML-DSA-87'
      }

      hsm.addKey({
        handle: result.pubHandle,
        family,
        role: 'public',
        label: `${labelSuffix} Token Pub`,
        generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })
      hsm.addKey({
        handle: result.privHandle,
        family,
        role: 'private',
        label: `${labelSuffix} Token Priv`,
        generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })

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
    setVerifyResult(null)
    liveSigBytesRef.current = null

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

        liveSigBytesRef.current = sig
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

  const handleVerify = useCallback(async () => {
    if (!isLive || !liveSigBytesRef.current) return
    setVerifying(true)
    setVerifyResult(null)

    try {
      const keys = keyCacheRef.current[selectedAlgorithm]
      if (!keys) throw new Error('No key pair cached — sign first')

      const M = hsm.moduleRef.current as unknown as SoftHSMModule
      const hSession = hsm.hSessionRef.current
      const { pubHandle } = keys
      const signingInput = `${base64url(JWT_HEADERS[selectedAlgorithm])}.${base64url(JWT_PAYLOAD)}`
      const sig = liveSigBytesRef.current

      let ok: boolean
      if (selectedAlgorithm === 'RS256') {
        ok = hsm_rsaVerify(M, hSession, pubHandle, signingInput, sig, CKM_SHA256_RSA_PKCS)
      } else if (selectedAlgorithm === 'ES256') {
        ok = hsm_ecdsaVerify(M, hSession, pubHandle, signingInput, sig, CKM_ECDSA_SHA256)
      } else {
        ok = hsm_verify(M, hSession, pubHandle, signingInput, sig)
      }

      setVerifyResult(ok)
    } catch (err) {
      console.error('[TokenMigrationLab] live verify error:', err)
      setVerifyResult(false)
    }
    setVerifying(false)
  }, [selectedAlgorithm, isLive, hsm])

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

      {/* CBOR/COSE Alternative Encoding */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info size={16} className="text-accent" aria-hidden="true" />
          <h4 className="text-sm font-bold text-foreground">
            Alternative: CBOR Token Encoding (CWT / COSE)
          </h4>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          JWT uses text-based JSON encoding. For constrained environments (IoT, mobile credentials,
          embedded systems), <strong className="text-foreground">CBOR Web Tokens (CWT)</strong> with{' '}
          <strong className="text-foreground">COSE signatures</strong> offer a binary-encoded
          alternative that reduces overhead — important when ML-DSA signatures already add
          kilobytes.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/40 rounded-lg p-3 border border-border">
            <div className="text-[10px] font-bold text-primary uppercase tracking-wide mb-1">
              JWT / JOSE
            </div>
            <ul className="text-[10px] text-muted-foreground space-y-0.5">
              <li>&bull; Text (base64url JSON)</li>
              <li>&bull; Wide browser/library support</li>
              <li>&bull; draft-ietf-jose-pqc-algorithms</li>
              <li>&bull; IETF standardization in progress</li>
            </ul>
          </div>
          <div className="bg-muted/40 rounded-lg p-3 border border-border">
            <div className="text-[10px] font-bold text-accent uppercase tracking-wide mb-1">
              CWT / COSE
            </div>
            <ul className="text-[10px] text-muted-foreground space-y-0.5">
              <li>&bull; Binary (CBOR-encoded)</li>
              <li>&bull; Smaller envelope overhead</li>
              <li>&bull; draft-ietf-cose-dilithium</li>
              <li>&bull; Used in ISO 18013-5 mDL</li>
            </ul>
          </div>
          <div className="bg-muted/40 rounded-lg p-3 border border-border">
            <div className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">
              When to choose
            </div>
            <ul className="text-[10px] text-muted-foreground space-y-0.5">
              <li>&bull; IoT / embedded: CWT/COSE</li>
              <li>&bull; Mobile credentials: CWT/COSE</li>
              <li>&bull; Enterprise SSO / web: JWT</li>
              <li>&bull; Both: same ML-DSA signature</li>
            </ul>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
          Both JWT and CWT use the same underlying ML-DSA (FIPS 204) signature — only the token
          envelope encoding differs. See{' '}
          <span className="text-primary">draft-ietf-cose-dilithium</span> and{' '}
          <span className="text-primary">RFC 9052</span> in the Library for specification details.
        </p>
      </div>

      {/* Verification Flow — Relying Party Perspective */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-primary" aria-hidden="true" />
          <h4 className="text-sm font-bold text-foreground">
            Verification Flow — Relying Party Perspective
          </h4>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          After the IdP signs a JWT, the relying party must verify it. The verification chain: fetch
          JWKS endpoint → match <code className="text-primary">kid</code> → verify signature with
          the public key.{' '}
          {isLive
            ? 'With Live WASM enabled, click Verify to execute a real PKCS#11 v3.2 verification against the signed token above.'
            : 'Enable Live WASM and sign a token first to run live verification.'}
        </p>

        {/* JWKS endpoint example */}
        <div className="mb-4">
          <div className="text-xs font-bold text-foreground mb-1">
            JWKS Endpoint Response{' '}
            <span className="text-muted-foreground font-normal">(GET /.well-known/jwks.json)</span>
          </div>
          <pre className="text-[10px] font-mono text-foreground bg-muted/50 rounded p-3 border border-border overflow-x-auto whitespace-pre">
            {JWKS_EXAMPLES[selectedAlgorithm]}
          </pre>
          {isQuantumSafe && (
            <p className="text-[10px] text-muted-foreground mt-1">
              ML-DSA public keys use <code className="text-primary">kty: &quot;AKP&quot;</code>{' '}
              (Algorithm Key Pair) per draft-ietf-jose-pqc-algorithms. The{' '}
              <code className="text-primary">pub</code> field holds the base64url-encoded public
              key.
            </p>
          )}
        </div>

        {/* Three-step verification flow */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          {(
            [
              {
                step: '1',
                label: 'Fetch JWKS',
                detail:
                  'GET /.well-known/jwks.json — resolve public key matching kid in JWT header',
              },
              {
                step: '2',
                label: 'Reconstruct input',
                detail:
                  'base64url(header) + "." + base64url(payload) — identical to what was signed',
              },
              {
                step: '3',
                label: selectedAlgorithm.startsWith('ML-DSA')
                  ? 'C_MessageVerifyInit / C_VerifyMessage'
                  : 'C_VerifyInit / C_Verify',
                detail: `PKCS#11 v3.2 verify with ${selectedAlgorithm} public key — returns CKR_OK or CKR_SIGNATURE_INVALID`,
              },
            ] as const
          ).map(({ step, label, detail }) => (
            <div key={step} className="bg-muted/40 rounded-lg p-3 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  {step}
                </span>
                <span className="text-[10px] font-bold text-foreground">{label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>

        {/* Live verify button + result */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button
            onClick={handleVerify}
            disabled={!isLive || !signed || !liveSignatureHex || verifying}
            variant="outline"
            className="flex items-center gap-2"
          >
            {verifying ? (
              <>
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck size={14} aria-hidden="true" />
                Verify Signature (Live WASM)
              </>
            )}
          </Button>

          {verifyResult !== null && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${
                verifyResult
                  ? 'bg-status-success/10 border-status-success/30 text-status-success'
                  : 'bg-status-error/10 border-status-error/30 text-status-error'
              }`}
            >
              {verifyResult ? (
                <>
                  <CheckCircle2 size={14} aria-hidden="true" />
                  Signature valid — CKR_OK
                </>
              ) : (
                <>
                  <AlertTriangle size={14} aria-hidden="true" />
                  Signature invalid — CKR_SIGNATURE_INVALID
                </>
              )}
            </div>
          )}

          {!isLive && (
            <p className="text-[10px] text-muted-foreground">
              Enable Live WASM above, then sign a token to unlock verification.
            </p>
          )}
          {isLive && !signed && (
            <p className="text-[10px] text-muted-foreground">Sign a token first to verify it.</p>
          )}
        </div>
      </div>

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong>{' '}
          {isLive
            ? 'All signing and verification operations execute in SoftHSM3 WASM — a reference PKCS#11 v3.2 implementation. Real key pairs are generated and cached per algorithm. Signature sizes match the actual FIPS 204 / PKCS#1 / ECDSA specifications.'
            : 'In simulation mode, signature data is representative. Disable Simulation to execute real PKCS#11 v3.2 signing and verification operations across all five algorithms.'}{' '}
          Generated keys are for educational purposes only.
        </p>
      </div>

      <KatValidationPanel
        specs={IAM_KAT_SPECS}
        label="IAM PQC Known Answer Tests"
        authorityNote="OpenID Connect · SAML 2.0 · FIPS 204 · FIPS 198-1 · NIST SP 800-132"
      />

      {hsm.isReady && (
        <div className="space-y-4">
          <Pkcs11LogPanel
            log={hsm.log}
            onClear={hsm.clearLog}
            title="PKCS#11 Call Log — Token Migration"
            defaultOpen={false}
            filterFns={LIVE_OPERATIONS}
          />
          <HsmKeyInspector
            keys={hsm.keys}
            moduleRef={hsm.moduleRef}
            hSessionRef={hsm.hSessionRef}
            onRemoveKey={hsm.removeKey}
          />
        </div>
      )}
    </div>
  )
}
