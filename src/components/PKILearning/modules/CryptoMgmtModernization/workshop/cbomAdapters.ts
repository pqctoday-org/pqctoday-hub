// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure adapters mapping the Library CBOM Builder's catalog/SBOM rows onto the
 * shared CycloneDX 1.7 component model (`services/cbom/cycloneDx.ts`), plus the
 * version-aware SBOM→catalog matcher. Split out of the component so the matcher
 * and adapters stay unit-testable (and the component file stays component-only).
 */
import {
  CRYPTO_LIBRARIES,
  type CryptoLibrary,
  type EsvStatus,
  type FipsStatus,
  type RiskColor,
} from '../data/cryptoLibraries'
import type { HsmVendorRecord } from '../data/hsmVendors'
import type { FileArtifactRecord } from '../data/fileArtifacts'
import {
  cbomBomRef,
  extractAllAlgorithmsFromText,
  type CbomComponentInput,
  type CbomProperty,
} from '@/services/cbom/cycloneDx'

export interface CbomRow {
  name: string
  version: string
  matched: boolean
  fipsStatus: FipsStatus
  esvStatus: EsvStatus
  pqcSupport: string
  posture: RiskColor
  notes: string
}

/** SBOM package names that differ from the catalog's display name. */
const LIB_NAME_ALIASES: Record<string, string> = {
  'bcprov-fips': 'bouncy castle fips (java)',
  'bcpkix-fips': 'bouncy castle fips (java)',
  'bc-fips': 'bouncy castle fips (java)',
}

/** The leading numeric portion of a version string ("1.1.1w" → "1.1.1"). */
function numericVersion(v: string): string {
  const m = v.match(/\d+(\.\d+)*/)
  return m ? m[0] : ''
}

/** "1.1.1" → "1.1" (major.minor) for disambiguating same-name catalog entries. */
function majorMinor(v: string): string {
  return v.split('.').slice(0, 2).join('.')
}

/**
 * Match an SBOM component to a catalog library. Unlike a naive first-token
 * `includes()`, this is version-aware: when several catalog entries share a name
 * (e.g. OpenSSL 3.5 vs the EoL 1.1.1), the version disambiguates — so a legacy
 * `openssl@1.1.1w` resolves to the red "crypto-debt" record, not the green 3.5.
 */
export function matchLibrary(name: string, version: string): CryptoLibrary | undefined {
  const n = name.toLowerCase().trim()
  const aliased = LIB_NAME_ALIASES[n] ?? n
  const candidates = CRYPTO_LIBRARIES.filter((l) => {
    const ln = l.name.toLowerCase()
    if (ln === aliased) return true
    const primary = ln.split(/[\s/]+/)[0]
    return (
      primary.length >= 4 &&
      (aliased === primary || aliased.startsWith(primary) || n.includes(primary))
    )
  })
  if (candidates.length <= 1) return candidates[0]
  const cv = numericVersion(version)
  if (cv) {
    const byVersion = candidates.find(
      (l) => majorMinor(numericVersion(l.latestVersion)) === majorMinor(cv)
    )
    if (byVersion) return byVersion
  }
  return candidates[0]
}

// ── Adapters: each catalog shape → a neutral CBOM component input ────────────

export function libraryToCbomInput(lib: CryptoLibrary): CbomComponentInput {
  const properties: CbomProperty[] = [
    { name: 'pqctoday:fipsStatus', value: lib.fipsStatus },
    { name: 'pqctoday:esvStatus', value: lib.esvStatus },
    { name: 'pqctoday:posture', value: lib.posture },
  ]
  if (lib.eolDate) properties.push({ name: 'pqctoday:eolDate', value: lib.eolDate })
  return {
    type: 'library',
    name: lib.name,
    bomRef: cbomBomRef(lib.name, lib.id),
    version: lib.latestVersion,
    description: lib.notes,
    publisher: lib.vendor,
    properties,
    certifications: lib.cmvpCertNumber
      ? [{ certType: 'FIPS 140-3 CMVP', certId: lib.cmvpCertNumber }]
      : [],
    algorithms: extractAllAlgorithmsFromText(lib.pqcSupport),
  }
}

export function hsmToCbomInput(h: HsmVendorRecord): CbomComponentInput {
  return {
    type: 'device',
    name: `${h.vendor} ${h.product}`,
    bomRef: cbomBomRef(h.product, h.id),
    version: h.firmwareRev,
    description: h.notes,
    publisher: h.vendor,
    properties: [
      { name: 'pqctoday:fipsLevel', value: `FIPS 140-3 Level ${h.fipsLevel}` },
      { name: 'pqctoday:fipsStatus', value: h.fipsStatus },
      { name: 'pqctoday:platformBinding', value: h.platformBinding },
      { name: 'pqctoday:posture', value: h.posture },
    ],
    certifications: h.cmvpCertNumber
      ? [{ certType: 'FIPS 140-3 CMVP', certId: h.cmvpCertNumber }]
      : [],
    algorithms: extractAllAlgorithmsFromText(h.pqcSupport),
  }
}

export function fileArtifactToCbomInput(f: FileArtifactRecord): CbomComponentInput {
  return {
    type: 'file',
    name: f.label,
    bomRef: cbomBomRef(f.label, f.id),
    description: f.notes,
    properties: [
      { name: 'pqctoday:category', value: f.category },
      { name: 'pqctoday:classical', value: f.classical },
      { name: 'pqctoday:pqcTarget', value: f.pqcTarget },
      { name: 'pqctoday:posture', value: f.posture },
    ],
    // 07092026: `f.classical` (e.g. "RSA-4096 or Ed25519") previously only
    // appeared as a flat property string — now also detected as a real
    // crypto-asset, combined with `f.pqcTarget` so a migration-target pairing
    // in the same record can be recognized as hybrid when the text signals it.
    algorithms: extractAllAlgorithmsFromText(`${f.classical} ${f.pqcTarget}`),
  }
}

export function cbomRowToCbomInput(r: CbomRow): CbomComponentInput {
  return {
    type: 'library',
    name: r.name || 'unknown-component',
    bomRef: cbomBomRef(`${r.name || 'unknown'}-${r.version || '0'}`),
    version: r.version || undefined,
    properties: [
      { name: 'pqctoday:matched', value: String(r.matched) },
      { name: 'pqctoday:fipsStatus', value: r.fipsStatus },
      { name: 'pqctoday:esvStatus', value: r.esvStatus },
      { name: 'pqctoday:posture', value: r.posture },
    ],
    algorithms:
      r.pqcSupport && r.pqcSupport !== '—' ? extractAllAlgorithmsFromText(r.pqcSupport) : [],
  }
}
