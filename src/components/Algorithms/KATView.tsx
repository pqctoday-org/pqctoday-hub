// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo, useCallback } from 'react'
import {
  Shield,
  Lock,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Terminal,
  ShieldCheck,
  KeyRound,
  Hash,
  PenTool,
  Waypoints,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { useHSM } from '@/hooks/useHSM'
import { runKAT } from '@/utils/katRunner'
import type { KatTestSpec, KATResult, SlhDsaVariant } from '@/utils/katRunner'
import type { UseHSMResult } from '@/hooks/useHSM'

// ── ACVP source URLs ────────────────────────────────────────────────────────

const ACVP_MLKEM_URL =
  'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/ML-KEM-encapDecap-FIPS203'
const ACVP_MLDSA_URL =
  'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/ML-DSA-sigGen-FIPS204'

const ACVP_AES_GCM_URL =
  'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/AES-GCM'
const ACVP_AES_CBC_URL =
  'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/AES-CBC-CS1'
const ACVP_AES_CTR_URL =
  'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/AES-CTR'
const ACVP_AES_KW_URL =
  'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/AES-KW'
const ACVP_HMAC_URL =
  'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/HMAC-SHA2-256'
const ACVP_SHA_URL =
  'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/SHA2-256'
const ACVP_ECDSA_URL =
  'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/ECDSA'
const ACVP_EDDSA_URL =
  'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/EDDSA'
const ACVP_RSA_URL = 'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/RSA'
const ACVP_PBKDF2_URL =
  'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/PBKDF'
const ACVP_HKDF_URL = 'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/HKDF'

const FIPS_203_URL = 'https://csrc.nist.gov/pubs/fips/203/final'
const FIPS_204_URL = 'https://csrc.nist.gov/pubs/fips/204/final'
const FIPS_205_URL = 'https://csrc.nist.gov/pubs/fips/205/final'
const SP_800_38D_URL = 'https://csrc.nist.gov/pubs/sp/800/38/d/final'
const SP_800_38A_URL = 'https://csrc.nist.gov/pubs/sp/800/38/a/final'
const RFC_3394_URL = 'https://www.rfc-editor.org/rfc/rfc3394'
const FIPS_198_URL = 'https://csrc.nist.gov/pubs/fips/198-1/final'
const FIPS_180_URL = 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final'
const FIPS_186_URL = 'https://csrc.nist.gov/pubs/fips/186-5/final'
const RFC_8032_URL = 'https://www.rfc-editor.org/rfc/rfc8032'
const RFC_8018_URL = 'https://www.rfc-editor.org/rfc/rfc8018'
const RFC_5869_URL = 'https://www.rfc-editor.org/rfc/rfc5869'

// ── Tile configuration ──────────────────────────────────────────────────────

interface KATTileConfig {
  id: string
  name: string
  standard: string
  fipsUrl: string
  /** NIST level (1-5) for PQC, or bit strength (128/192/256) for classical */
  securityLevel: number
  acvpUrl: string
  testTypes: string[]
  specs: KatTestSpec[]
}

/** Render security level badge text — "Level X" for PQC (1-5), "X-bit" for classical */
function levelLabel(n: number): string {
  return n <= 5 ? `Level ${n}` : `${n}-bit`
}

const ML_KEM_TILES: KATTileConfig[] = [
  {
    id: 'mlkem-512',
    name: 'ML-KEM-512',
    standard: 'FIPS 203',
    fipsUrl: FIPS_203_URL,
    securityLevel: 1,
    acvpUrl: ACVP_MLKEM_URL,
    testTypes: ['ACVP Decap', 'Encap Round-Trip'],
    specs: [
      {
        id: 'kat-algo-mlkem512-decap',
        useCase: 'ML-KEM-512 decapsulation',
        standard: 'FIPS 203',
        referenceUrl: FIPS_203_URL,
        kind: { type: 'mlkem-decap', variant: 512 },
      },
      {
        id: 'kat-algo-mlkem512-rt',
        useCase: 'ML-KEM-512 encap+decap round-trip',
        standard: 'FIPS 203',
        referenceUrl: FIPS_203_URL,
        kind: { type: 'mlkem-encap-roundtrip', variant: 512 },
      },
    ],
  },
  {
    id: 'mlkem-768',
    name: 'ML-KEM-768',
    standard: 'FIPS 203',
    fipsUrl: FIPS_203_URL,
    securityLevel: 3,
    acvpUrl: ACVP_MLKEM_URL,
    testTypes: ['ACVP Decap', 'Encap Round-Trip'],
    specs: [
      {
        id: 'kat-algo-mlkem768-decap',
        useCase: 'ML-KEM-768 decapsulation',
        standard: 'FIPS 203',
        referenceUrl: FIPS_203_URL,
        kind: { type: 'mlkem-decap', variant: 768 },
      },
      {
        id: 'kat-algo-mlkem768-rt',
        useCase: 'ML-KEM-768 encap+decap round-trip',
        standard: 'FIPS 203',
        referenceUrl: FIPS_203_URL,
        kind: { type: 'mlkem-encap-roundtrip', variant: 768 },
      },
    ],
  },
  {
    id: 'mlkem-1024',
    name: 'ML-KEM-1024',
    standard: 'FIPS 203',
    fipsUrl: FIPS_203_URL,
    securityLevel: 5,
    acvpUrl: ACVP_MLKEM_URL,
    testTypes: ['ACVP Decap', 'Encap Round-Trip'],
    specs: [
      {
        id: 'kat-algo-mlkem1024-decap',
        useCase: 'ML-KEM-1024 decapsulation',
        standard: 'FIPS 203',
        referenceUrl: FIPS_203_URL,
        kind: { type: 'mlkem-decap', variant: 1024 },
      },
      {
        id: 'kat-algo-mlkem1024-rt',
        useCase: 'ML-KEM-1024 encap+decap round-trip',
        standard: 'FIPS 203',
        referenceUrl: FIPS_203_URL,
        kind: { type: 'mlkem-encap-roundtrip', variant: 1024 },
      },
    ],
  },
]

const ML_DSA_TILES: KATTileConfig[] = [
  {
    id: 'mldsa-44',
    name: 'ML-DSA-44',
    standard: 'FIPS 204',
    fipsUrl: FIPS_204_URL,
    securityLevel: 2,
    acvpUrl: ACVP_MLDSA_URL,
    testTypes: ['ACVP SigVer', 'Functional Round-Trip'],
    specs: [
      {
        id: 'kat-algo-mldsa44-sigver',
        useCase: 'ML-DSA-44 signature verification',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-sigver', variant: 44 },
      },
      {
        id: 'kat-algo-mldsa44-rt',
        useCase: 'ML-DSA-44 sign+verify round-trip',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-functional', variant: 44 },
      },
    ],
  },
  {
    id: 'mldsa-65',
    name: 'ML-DSA-65',
    standard: 'FIPS 204',
    fipsUrl: FIPS_204_URL,
    securityLevel: 3,
    acvpUrl: ACVP_MLDSA_URL,
    testTypes: ['ACVP SigVer', 'Functional Round-Trip'],
    specs: [
      {
        id: 'kat-algo-mldsa65-sigver',
        useCase: 'ML-DSA-65 signature verification',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-sigver', variant: 65 },
      },
      {
        id: 'kat-algo-mldsa65-rt',
        useCase: 'ML-DSA-65 sign+verify round-trip',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-functional', variant: 65 },
      },
    ],
  },
  {
    id: 'mldsa-87',
    name: 'ML-DSA-87',
    standard: 'FIPS 204',
    fipsUrl: FIPS_204_URL,
    securityLevel: 5,
    acvpUrl: ACVP_MLDSA_URL,
    testTypes: ['ACVP SigVer', 'Functional Round-Trip'],
    specs: [
      {
        id: 'kat-algo-mldsa87-sigver',
        useCase: 'ML-DSA-87 signature verification',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-sigver', variant: 87 },
      },
      {
        id: 'kat-algo-mldsa87-rt',
        useCase: 'ML-DSA-87 sign+verify round-trip',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-functional', variant: 87 },
      },
    ],
  },
]

// ── SLH-DSA variant data ────────────────────────────────────────────────────

const SLH_DSA_VARIANTS: { value: SlhDsaVariant; label: string; level: number }[] = [
  { value: 'SHA2-128s', label: 'SHA2-128s', level: 1 },
  { value: 'SHA2-128f', label: 'SHA2-128f', level: 1 },
  { value: 'SHA2-192s', label: 'SHA2-192s', level: 3 },
  { value: 'SHA2-192f', label: 'SHA2-192f', level: 3 },
  { value: 'SHA2-256s', label: 'SHA2-256s', level: 5 },
  { value: 'SHA2-256f', label: 'SHA2-256f', level: 5 },
  { value: 'SHAKE-128s', label: 'SHAKE-128s', level: 1 },
  { value: 'SHAKE-128f', label: 'SHAKE-128f', level: 1 },
  { value: 'SHAKE-192s', label: 'SHAKE-192s', level: 3 },
  { value: 'SHAKE-192f', label: 'SHAKE-192f', level: 3 },
  { value: 'SHAKE-256s', label: 'SHAKE-256s', level: 5 },
  { value: 'SHAKE-256f', label: 'SHAKE-256f', level: 5 },
]

const SLH_DSA_DROPDOWN_ITEMS = SLH_DSA_VARIANTS.map((v) => ({
  id: v.value,
  label: `SLH-DSA-${v.label} (Level ${v.level})`,
}))

// ── AES Symmetric tiles ─────────────────────────────────────────────────────

const AES_TILES: KATTileConfig[] = [
  {
    id: 'aesgcm',
    name: 'AES-256-GCM',
    standard: 'SP 800-38D',
    fipsUrl: SP_800_38D_URL,
    securityLevel: 256,
    acvpUrl: ACVP_AES_GCM_URL,
    testTypes: ['ACVP Decrypt'],
    specs: [
      {
        id: 'kat-algo-aesgcm',
        useCase: 'AES-256-GCM decryption',
        standard: 'SP 800-38D',
        referenceUrl: SP_800_38D_URL,
        kind: { type: 'aesgcm-decrypt' },
      },
    ],
  },
  {
    id: 'aescbc',
    name: 'AES-256-CBC',
    standard: 'SP 800-38A',
    fipsUrl: SP_800_38A_URL,
    securityLevel: 256,
    acvpUrl: ACVP_AES_CBC_URL,
    testTypes: ['ACVP Decrypt'],
    specs: [
      {
        id: 'kat-algo-aescbc',
        useCase: 'AES-256-CBC decryption',
        standard: 'SP 800-38A',
        referenceUrl: SP_800_38A_URL,
        kind: { type: 'aescbc-decrypt' },
      },
    ],
  },
  {
    id: 'aesctr',
    name: 'AES-256-CTR',
    standard: 'SP 800-38A',
    fipsUrl: SP_800_38A_URL,
    securityLevel: 256,
    acvpUrl: ACVP_AES_CTR_URL,
    testTypes: ['ACVP Round-Trip'],
    specs: [
      {
        id: 'kat-algo-aesctr',
        useCase: 'AES-256-CTR encrypt+decrypt round-trip',
        standard: 'SP 800-38A',
        referenceUrl: SP_800_38A_URL,
        kind: { type: 'aesctr-roundtrip' },
      },
    ],
  },
  {
    id: 'aeskw',
    name: 'AES Key Wrap',
    standard: 'RFC 3394',
    fipsUrl: RFC_3394_URL,
    securityLevel: 256,
    acvpUrl: ACVP_AES_KW_URL,
    testTypes: ['ACVP Wrap'],
    specs: [
      {
        id: 'kat-algo-aeskw',
        useCase: 'AES Key Wrap',
        standard: 'RFC 3394',
        referenceUrl: RFC_3394_URL,
        kind: { type: 'aeskw-wrap' },
      },
    ],
  },
]

// ── HMAC / Hash tiles ───────────────────────────────────────────────────────

const HMAC_HASH_TILES: KATTileConfig[] = [
  {
    id: 'hmac-sha256',
    name: 'HMAC-SHA-256',
    standard: 'FIPS 198-1',
    fipsUrl: FIPS_198_URL,
    securityLevel: 128,
    acvpUrl: ACVP_HMAC_URL,
    testTypes: ['ACVP Verify'],
    specs: [
      {
        id: 'kat-algo-hmac256',
        useCase: 'HMAC-SHA-256 verification',
        standard: 'FIPS 198-1',
        referenceUrl: FIPS_198_URL,
        kind: { type: 'hmac-verify', hashAlg: 'SHA-256' },
      },
    ],
  },
  {
    id: 'hmac-sha384',
    name: 'HMAC-SHA-384',
    standard: 'FIPS 198-1',
    fipsUrl: FIPS_198_URL,
    securityLevel: 192,
    acvpUrl: ACVP_HMAC_URL,
    testTypes: ['ACVP Verify'],
    specs: [
      {
        id: 'kat-algo-hmac384',
        useCase: 'HMAC-SHA-384 verification',
        standard: 'FIPS 198-1',
        referenceUrl: FIPS_198_URL,
        kind: { type: 'hmac-verify', hashAlg: 'SHA-384' },
      },
    ],
  },
  {
    id: 'hmac-sha512',
    name: 'HMAC-SHA-512',
    standard: 'FIPS 198-1',
    fipsUrl: FIPS_198_URL,
    securityLevel: 256,
    acvpUrl: ACVP_HMAC_URL,
    testTypes: ['ACVP Verify'],
    specs: [
      {
        id: 'kat-algo-hmac512',
        useCase: 'HMAC-SHA-512 verification',
        standard: 'FIPS 198-1',
        referenceUrl: FIPS_198_URL,
        kind: { type: 'hmac-verify', hashAlg: 'SHA-512' },
      },
    ],
  },
  {
    id: 'sha256',
    name: 'SHA-256',
    standard: 'FIPS 180-4',
    fipsUrl: FIPS_180_URL,
    securityLevel: 128,
    acvpUrl: ACVP_SHA_URL,
    testTypes: ['ACVP Hash'],
    specs: [
      {
        id: 'kat-algo-sha256',
        useCase: 'SHA-256 hash',
        standard: 'FIPS 180-4',
        referenceUrl: FIPS_180_URL,
        kind: { type: 'sha256-hash' },
      },
    ],
  },
]

// ── Classical Signature tiles ───────────────────────────────────────────────

const CLASSICAL_SIG_TILES: KATTileConfig[] = [
  {
    id: 'ecdsa-p256',
    name: 'ECDSA P-256',
    standard: 'FIPS 186-5',
    fipsUrl: FIPS_186_URL,
    securityLevel: 128,
    acvpUrl: ACVP_ECDSA_URL,
    testTypes: ['ACVP SigVer'],
    specs: [
      {
        id: 'kat-algo-ecdsa-p256',
        useCase: 'ECDSA P-256 signature verification',
        standard: 'FIPS 186-5',
        referenceUrl: FIPS_186_URL,
        kind: { type: 'ecdsa-sigver', curve: 'P-256' },
      },
    ],
  },
  {
    id: 'ecdsa-p384',
    name: 'ECDSA P-384',
    standard: 'FIPS 186-5',
    fipsUrl: FIPS_186_URL,
    securityLevel: 192,
    acvpUrl: ACVP_ECDSA_URL,
    testTypes: ['ACVP SigVer'],
    specs: [
      {
        id: 'kat-algo-ecdsa-p384',
        useCase: 'ECDSA P-384 signature verification',
        standard: 'FIPS 186-5',
        referenceUrl: FIPS_186_URL,
        kind: { type: 'ecdsa-sigver', curve: 'P-384' },
      },
    ],
  },
  {
    id: 'eddsa',
    name: 'EdDSA (Ed25519)',
    standard: 'RFC 8032',
    fipsUrl: RFC_8032_URL,
    securityLevel: 128,
    acvpUrl: ACVP_EDDSA_URL,
    testTypes: ['ACVP SigVer'],
    specs: [
      {
        id: 'kat-algo-eddsa',
        useCase: 'EdDSA Ed25519 signature verification',
        standard: 'RFC 8032',
        referenceUrl: RFC_8032_URL,
        kind: { type: 'eddsa-sigver' },
      },
    ],
  },
  {
    id: 'rsapss',
    name: 'RSA-PSS',
    standard: 'FIPS 186-5',
    fipsUrl: FIPS_186_URL,
    securityLevel: 112,
    acvpUrl: ACVP_RSA_URL,
    testTypes: ['ACVP SigVer'],
    specs: [
      {
        id: 'kat-algo-rsapss',
        useCase: 'RSA-PSS signature verification',
        standard: 'FIPS 186-5',
        referenceUrl: FIPS_186_URL,
        kind: { type: 'rsapss-sigver' },
      },
    ],
  },
]

// ── Key Derivation tiles ────────────────────────────────────────────────────

const KDF_TILES: KATTileConfig[] = [
  {
    id: 'pbkdf2',
    name: 'PBKDF2-SHA-256',
    standard: 'RFC 8018',
    fipsUrl: RFC_8018_URL,
    securityLevel: 128,
    acvpUrl: ACVP_PBKDF2_URL,
    testTypes: ['ACVP Derive'],
    specs: [
      {
        id: 'kat-algo-pbkdf2',
        useCase: 'PBKDF2-HMAC-SHA-256 key derivation',
        standard: 'RFC 8018',
        referenceUrl: RFC_8018_URL,
        kind: { type: 'pbkdf2-derive', prf: 'SHA-256' },
      },
    ],
  },
  {
    id: 'hkdf',
    name: 'HKDF-SHA-256',
    standard: 'RFC 5869',
    fipsUrl: RFC_5869_URL,
    securityLevel: 128,
    acvpUrl: ACVP_HKDF_URL,
    testTypes: ['ACVP Derive'],
    specs: [
      {
        id: 'kat-algo-hkdf',
        useCase: 'HKDF-SHA-256 extract+expand',
        standard: 'RFC 5869',
        referenceUrl: RFC_5869_URL,
        kind: { type: 'hkdf-derive' },
      },
    ],
  },
]

// ── Results table (shared by all tiles) ─────────────────────────────────────

const ResultsTable: React.FC<{ results: KATResult[] }> = ({ results }) => (
  <div className="overflow-x-auto rounded-lg border border-border">
    <table className="w-full text-xs text-left">
      <thead>
        <tr className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider">
          <th className="px-3 py-2 font-semibold">Use Case</th>
          <th className="px-3 py-2 font-semibold">Algorithm</th>
          <th className="px-3 py-2 font-semibold">Status</th>
          <th className="px-3 py-2 font-semibold">Details</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/40">
        {results.map((r) => (
          <tr key={r.id} className="hover:bg-muted/20 transition-colors">
            <td className="px-3 py-2 font-medium text-foreground">{r.useCase}</td>
            <td className="px-3 py-2 font-mono text-foreground">{r.algorithm}</td>
            <td className="px-3 py-2">
              <span
                className={
                  r.status === 'pass'
                    ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-status-success/10 text-status-success'
                    : 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-status-error/10 text-status-error'
                }
              >
                {r.status === 'pass' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                {r.status}
              </span>
            </td>
            <td className="px-3 py-2 text-muted-foreground">{r.details}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

// ── Tile components ─────────────────────────────────────────────────────────

interface KATTileProps {
  config: KATTileConfig
  hsm: UseHSMResult
}

const KATTile: React.FC<KATTileProps> = ({ config, hsm }) => {
  const [results, setResults] = useState<KATResult[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultsOpen, setResultsOpen] = useState(false)

  const passCount = results.filter((r) => r.status === 'pass').length
  const done = results.length === config.specs.length && !running

  const handleRun = useCallback(async () => {
    setRunning(true)
    setError(null)
    setResults([])
    setResultsOpen(true)
    try {
      if (!hsm.isReady) await hsm.initialize()
      const M = hsm.moduleRef.current!
      const hSession = hsm.hSessionRef.current
      const out: KATResult[] = []
      for (const spec of config.specs) {
        const r = await runKAT(M, hSession, spec)
        out.push(r)
        setResults([...out])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
    }
  }, [hsm, config.specs])

  return (
    <div className="border border-border rounded-lg p-5 bg-muted/30 hover:border-primary/50 transition-colors space-y-4">
      <div className="flex items-start justify-between">
        <h5 className="font-semibold text-foreground text-lg">{config.name}</h5>
        <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30">
          {levelLabel(config.securityLevel)}
        </span>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Standard</span>
          <a
            href={config.fipsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-mono text-xs inline-flex items-center gap-1"
          >
            {config.standard}
            <ExternalLink size={10} />
          </a>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tests</span>
          <span className="text-foreground text-xs">{config.testTypes.join(' + ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">ACVP Vectors</span>
          <a
            href={config.acvpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-xs inline-flex items-center gap-1"
          >
            NIST GitHub
            <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Run button */}
      <Button variant="outline" size="sm" onClick={handleRun} disabled={running} className="w-full">
        {running ? (
          <>
            <Loader2 size={14} className="animate-spin mr-2" />
            Running...
          </>
        ) : (
          <>
            <ShieldCheck size={14} className="mr-2" />
            Run NIST KAT
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-status-error bg-status-error/10 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Collapsible results */}
      {results.length > 0 && (
        <div className="border-t border-border pt-3">
          <Button
            variant="ghost"
            onClick={() => setResultsOpen(!resultsOpen)}
            className="flex items-center gap-2 w-full justify-start text-sm font-medium text-foreground hover:text-primary px-0"
          >
            {resultsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Results</span>
            {done && (
              <span className="ml-auto text-xs text-muted-foreground">
                {passCount === results.length ? (
                  <span className="text-status-success">
                    {passCount}/{results.length} passed
                  </span>
                ) : (
                  <span className="text-status-error">
                    {passCount}/{results.length} passed
                  </span>
                )}
              </span>
            )}
          </Button>
          {resultsOpen && (
            <div className="mt-2">
              <ResultsTable results={results} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── SLH-DSA grouped tile ────────────────────────────────────────────────────

const SLHDSATile: React.FC<{ hsm: UseHSMResult }> = ({ hsm }) => {
  const [variant, setVariant] = useState<SlhDsaVariant>('SHA2-128s')
  const [results, setResults] = useState<KATResult[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultsOpen, setResultsOpen] = useState(false)

  const level = variant.includes('128') ? 1 : variant.includes('192') ? 3 : 5

  const specs: KatTestSpec[] = useMemo(
    () => [
      {
        id: `kat-algo-slhdsa-${variant}`,
        useCase: `SLH-DSA-${variant} sign+verify round-trip`,
        standard: 'FIPS 205',
        referenceUrl: FIPS_205_URL,
        kind: { type: 'slhdsa-functional' as const, variant },
      },
    ],
    [variant]
  )

  const passCount = results.filter((r) => r.status === 'pass').length
  const done = results.length === specs.length && !running

  const handleRun = useCallback(async () => {
    setRunning(true)
    setError(null)
    setResults([])
    setResultsOpen(true)
    try {
      if (!hsm.isReady) await hsm.initialize()
      const M = hsm.moduleRef.current!
      const hSession = hsm.hSessionRef.current
      const out: KATResult[] = []
      for (const spec of specs) {
        const r = await runKAT(M, hSession, spec)
        out.push(r)
        setResults([...out])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
    }
  }, [hsm, specs])

  const handleVariantChange = (id: string) => {
    setVariant(id as SlhDsaVariant)
    setResults([])
    setError(null)
    setResultsOpen(false)
  }

  return (
    <div className="border border-border rounded-lg p-5 bg-muted/30 hover:border-primary/50 transition-colors space-y-4 md:col-span-2 lg:col-span-3">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <h5 className="font-semibold text-foreground text-lg">SLH-DSA (Stateless Hash-Based)</h5>
        <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30">
          Level {level}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">Variant:</span>
        <FilterDropdown
          items={SLH_DSA_DROPDOWN_ITEMS}
          selectedId={variant}
          onSelect={handleVariantChange}
          defaultLabel="SHA2-128s"
          variant="ghost"
        />
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Standard</span>
          <a
            href={FIPS_205_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-mono text-xs inline-flex items-center gap-1"
          >
            FIPS 205
            <ExternalLink size={10} />
          </a>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tests</span>
          <span className="text-foreground text-xs">Functional Round-Trip</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Note</span>
          <span className="text-muted-foreground text-xs italic">
            ACVP vectors too large to embed
          </span>
        </div>
      </div>

      {/* Run button */}
      <Button variant="outline" size="sm" onClick={handleRun} disabled={running}>
        {running ? (
          <>
            <Loader2 size={14} className="animate-spin mr-2" />
            Running...
          </>
        ) : (
          <>
            <ShieldCheck size={14} className="mr-2" />
            Run NIST KAT
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-status-error bg-status-error/10 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Collapsible results */}
      {results.length > 0 && (
        <div className="border-t border-border pt-3">
          <Button
            variant="ghost"
            onClick={() => setResultsOpen(!resultsOpen)}
            className="flex items-center gap-2 w-full justify-start text-sm font-medium text-foreground hover:text-primary px-0"
          >
            {resultsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Results</span>
            {done && (
              <span className="ml-auto text-xs text-muted-foreground">
                {passCount === results.length ? (
                  <span className="text-status-success">
                    {passCount}/{results.length} passed
                  </span>
                ) : (
                  <span className="text-status-error">
                    {passCount}/{results.length} passed
                  </span>
                )}
              </span>
            )}
          </Button>
          {resultsOpen && (
            <div className="mt-2">
              <ResultsTable results={results} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main KATView ────────────────────────────────────────────────────────────

export const KATView: React.FC = () => {
  const hsm = useHSM()
  const [diagOpen, setDiagOpen] = useState(false)

  return (
    <div className="space-y-8">
      {/* Intro banner */}
      <div className="flex items-start gap-3 p-4 bg-status-info border border-border rounded-lg">
        <Info className="text-primary flex-shrink-0 mt-0.5" size={20} />
        <div className="text-sm">
          <p className="font-semibold mb-1 text-foreground">NIST Known Answer Test Validation</p>
          <p className="text-muted-foreground">
            Run FIPS 203/204/205 Known Answer Tests against NIST ACVP test vectors in-browser using
            a WebAssembly PKCS#11 implementation. Each test validates cryptographic correctness
            without requiring external infrastructure.
          </p>
          <details className="mt-2 group">
            <summary className="text-xs font-medium text-primary cursor-pointer hover:underline">
              Why KATs matter
            </summary>
            <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              <p>
                Known Answer Tests verify that an implementation produces the{' '}
                <span className="font-medium text-foreground">exact same outputs</span> as the NIST
                reference specification for known inputs. This catches subtle implementation bugs
                (polynomial arithmetic errors, endianness issues, off-by-one in sampling) that could
                silently weaken security without being obvious.
              </p>
              <p>
                FIPS 140-3 requires KAT self-tests for CAVP/ACVP validation &mdash; every certified
                module must pass these before operating. Running them in-browser proves{' '}
                <span className="font-medium text-foreground">your copy</span> of the WASM library
                matches NIST test vectors, providing independent verification of cryptographic
                correctness.
              </p>
            </div>
          </details>
        </div>
      </div>

      {/* Key Encapsulation — ML-KEM */}
      <div className="glass-panel p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Lock className="text-primary" size={20} />
          Key Encapsulation (ML-KEM)
          <span className="text-sm font-normal text-muted-foreground">FIPS 203</span>
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ML_KEM_TILES.map((tile) => (
            <KATTile key={tile.id} config={tile} hsm={hsm} />
          ))}
        </div>
      </div>

      {/* Digital Signatures — ML-DSA + SLH-DSA */}
      <div className="glass-panel p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Shield className="text-primary" size={20} />
          Digital Signatures (ML-DSA, SLH-DSA)
          <span className="text-sm font-normal text-muted-foreground">FIPS 204, FIPS 205</span>
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ML_DSA_TILES.map((tile) => (
            <KATTile key={tile.id} config={tile} hsm={hsm} />
          ))}
          <SLHDSATile hsm={hsm} />
        </div>
      </div>

      {/* AES Symmetric */}
      <div className="glass-panel p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <KeyRound className="text-primary" size={20} />
          AES Symmetric
          <span className="text-sm font-normal text-muted-foreground">
            SP 800-38D, SP 800-38A, RFC 3394
          </span>
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {AES_TILES.map((tile) => (
            <KATTile key={tile.id} config={tile} hsm={hsm} />
          ))}
        </div>
      </div>

      {/* HMAC / Hash */}
      <div className="glass-panel p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Hash className="text-primary" size={20} />
          HMAC / Hash
          <span className="text-sm font-normal text-muted-foreground">FIPS 198-1, FIPS 180-4</span>
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {HMAC_HASH_TILES.map((tile) => (
            <KATTile key={tile.id} config={tile} hsm={hsm} />
          ))}
        </div>
      </div>

      {/* Classical Signatures */}
      <div className="glass-panel p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <PenTool className="text-primary" size={20} />
          Classical Signatures
          <span className="text-sm font-normal text-muted-foreground">FIPS 186-5, RFC 8032</span>
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CLASSICAL_SIG_TILES.map((tile) => (
            <KATTile key={tile.id} config={tile} hsm={hsm} />
          ))}
        </div>
      </div>

      {/* Key Derivation */}
      <div className="glass-panel p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Waypoints className="text-primary" size={20} />
          Key Derivation
          <span className="text-sm font-normal text-muted-foreground">RFC 8018, RFC 5869</span>
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {KDF_TILES.map((tile) => (
            <KATTile key={tile.id} config={tile} hsm={hsm} />
          ))}
        </div>
      </div>

      {/* PKCS#11 Diagnostics — collapsible */}
      <div className="glass-panel overflow-hidden">
        <Button
          variant="ghost"
          onClick={() => setDiagOpen(!diagOpen)}
          className="flex items-center gap-3 w-full justify-start text-left p-6 h-auto rounded-none hover:bg-muted/30"
        >
          <Terminal className="text-primary shrink-0" size={20} />
          <div className="flex-1 min-w-0 text-left">
            <h4 className="text-lg font-bold text-foreground">PKCS#11 Diagnostics</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Activity log and key inspector for all KAT operations
            </p>
          </div>
          <span className="text-xs text-muted-foreground mr-2">
            {hsm.log.length > 0 ? `${hsm.log.length} operations` : 'No activity yet'}
          </span>
          <ChevronDown
            size={18}
            className={`text-muted-foreground transition-transform ${diagOpen ? '' : '-rotate-90'}`}
          />
        </Button>

        {diagOpen && (
          <div className="px-6 pb-6 space-y-6 border-t border-border pt-4">
            <Pkcs11LogPanel
              log={hsm.log}
              onClear={hsm.clearLog}
              title="PKCS#11 Call Log — KAT Validation"
              defaultOpen
              emptyMessage="Run a KAT to see PKCS#11 operations here."
            />

            <HsmKeyInspector
              keys={hsm.keys}
              moduleRef={hsm.moduleRef}
              hSessionRef={hsm.hSessionRef}
              onRemoveKey={hsm.removeKey}
              onClear={hsm.clearKeys}
              title="HSM Key Registry — KAT Session"
            />
          </div>
        )}
      </div>
    </div>
  )
}
