#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * Generates skeleton content.ts files for learn modules by scanning existing
 * source code for fact patterns (FIPS/RFC references, algorithm names, dates).
 *
 * This is a bootstrapping tool — generated files need manual review.
 *
 * Usage:
 *   npx tsx scripts/generate-module-content-skeletons.ts [--dry-run] [--overwrite]
 */
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(process.cwd())
const MODULE_DIR = path.join(ROOT, 'src', 'components', 'PKILearning', 'modules')
const ALLOWLISTS_PATH = path.join(ROOT, 'scripts', 'fact_allowlists.json')
const DATA_DIR = path.join(ROOT, 'src', 'data')

const DRY_RUN = process.argv.includes('--dry-run')
const OVERWRITE = process.argv.includes('--overwrite')

// Load allowlists for validation
const allowlists = JSON.parse(fs.readFileSync(ALLOWLISTS_PATH, 'utf-8'))
const knownAlgorithms = new Set<string>(allowlists.canonical_algorithm_names as string[])

// Load library reference IDs
function loadLibraryIds(): Set<string> {
  const files = fs.readdirSync(DATA_DIR).filter((f) => /^library_\d{8}(_r\d+)?\.csv$/.test(f))
  if (files.length === 0) return new Set()
  files.sort((a, b) => {
    const dA = a.match(/library_(\d{8})/)?.[1] ?? ''
    const dB = b.match(/library_(\d{8})/)?.[1] ?? ''
    if (dA !== dB) return dB.localeCompare(dA)
    const rA = a.match(/_r(\d+)/)?.[1] ?? '0'
    const rB = b.match(/_r(\d+)/)?.[1] ?? '0'
    return parseInt(rB) - parseInt(rA)
  })
  const content = fs.readFileSync(path.join(DATA_DIR, files[0]), 'utf-8')
  const ids = new Set<string>()
  for (const line of content.split('\n').slice(1)) {
    const i = line.indexOf(',')
    if (i > 0) ids.add(line.slice(0, i).replace(/^"|"$/g, '').trim())
  }
  return ids
}

const libraryIds = loadLibraryIds()

// Module ID mapping (directory name → moduleData key)
const DIR_TO_MODULE_ID: Record<string, string> = {
  'Module1-Introduction': 'pqc-101',
  QuantumThreats: 'quantum-threats',
  HybridCrypto: 'hybrid-crypto',
  CryptoAgility: 'crypto-agility',
  TLSBasics: 'tls-basics',
  VPNSSHModule: 'vpn-ssh-pqc',
  EmailSigning: 'email-signing',
  PKIWorkshop: 'pki-workshop',
  KmsPqc: 'kms-pqc',
  HsmPqc: 'hsm-pqc',
  DataAssetSensitivity: 'data-asset-sensitivity',
  StatefulSignatures: 'stateful-signatures',
  DigitalAssets: 'digital-assets',
  FiveG: '5g-security',
  DigitalID: 'digital-id',
  Entropy: 'entropy-randomness',
  MerkleTreeCerts: 'merkle-tree-certs',
  QKD: 'qkd',
  CodeSigning: 'code-signing',
  APISecurityJWT: 'api-security-jwt',
  IoTOT: 'iot-ot-pqc',
  VendorRisk: 'vendor-risk',
  ComplianceStrategy: 'compliance-strategy',
  MigrationProgram: 'migration-program',
  PQCRiskManagement: 'pqc-risk-management',
  PQCBusinessCase: 'pqc-business-case',
  PQCGovernance: 'pqc-governance',
  CryptoDevAPIs: 'crypto-dev-apis',
  WebGatewayPQC: 'web-gateway-pqc',
  StandardsBodies: 'standards-bodies',
  ConfidentialComputing: 'confidential-computing',
  DatabaseEncryptionPQC: 'database-encryption-pqc',
  EnergyUtilities: 'energy-utilities-pqc',
  EMVPaymentPQC: 'emv-payment-pqc',
  AISecurityPQC: 'ai-security-pqc',
  PlatformEngPQC: 'platform-eng-pqc',
  HealthcarePQC: 'healthcare-pqc',
  AerospacePQC: 'aerospace-pqc',
  AutomotivePQC: 'automotive-pqc',
  ExecQuantumImpact: 'exec-quantum-impact',
  DevQuantumImpact: 'dev-quantum-impact',
  ArchQuantumImpact: 'arch-quantum-impact',
  OpsQuantumImpact: 'ops-quantum-impact',
  ResearchQuantumImpact: 'research-quantum-impact',
  SecretsManagementPQC: 'secrets-management-pqc',
  NetworkSecurityPQC: 'network-security-pqc',
  IAMPQC: 'iam-pqc',
  SecureBootPQC: 'secure-boot-pqc',
  OSPQC: 'os-pqc',
}

/** Recursively collect all .tsx/.ts files in a directory (excluding tests) */
function collectFiles(dir: string): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectFiles(full))
    } else if (/\.(tsx?|md)$/.test(entry.name) && !entry.name.includes('.test.')) {
      results.push(full)
    }
  }
  return results
}

/** Extract unique standard references (FIPS, RFC, SP, IR) from source files */
function extractStandards(files: string[]): string[] {
  const refs = new Set<string>()
  const patterns = [
    /\bFIPS[\s-]?(\d{3}(?:-\d+)?)\b/g,
    /\bRFC[\s-]?(\d{4,5})\b/g,
    /\bNIST\s+(?:SP|IR)[\s-]?(\d{3}-\d+|\d{4,5})\b/g,
  ]
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf-8')
    for (const p of patterns) {
      let m: RegExpExecArray | null
      const pat = new RegExp(p.source, p.flags)
      while ((m = pat.exec(content)) !== null) {
        // Reconstruct the full reference ID
        if (m[0].startsWith('FIPS')) {
          const num = m[0].match(/\d{3}(?:-\d+)?/)![0]
          refs.add(`FIPS ${num}`)
        } else if (m[0].startsWith('RFC')) {
          const num = m[0].match(/\d{4,5}/)![0]
          refs.add(`RFC ${num}`)
        } else if (m[0].includes('SP')) {
          const num = m[0].match(/(?:SP|IR)[\s-]?(\d{3}-\d+|\d{4,5})/)![1]
          const prefix = m[0].includes('SP') ? 'SP' : 'IR'
          refs.add(`NIST ${prefix} ${num}`)
        }
      }
    }
  }
  // Only keep refs that exist in the library
  return [...refs].filter((r) => libraryIds.has(r)).sort()
}

/** Extract algorithm names referenced in source files */
function extractAlgorithms(files: string[]): string[] {
  const found = new Set<string>()
  const algoPattern =
    /\b(ML-KEM-(?:512|768|1024)|ML-DSA-(?:44|65|87)|SLH-DSA-(?:SHA2|SHAKE)-\d+[sf]|FN-DSA-(?:512|1024)|FrodoKEM-\d+|HQC-\d+|Classic-McEliece-\d+|LMS-SHA256[^"']*|XMSS-SHA2_\d+|RSA-\d+|ECDSA P-\d+|Ed25519|X25519|ECDH P-\d+)\b/g
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf-8')
    let m: RegExpExecArray | null
    while ((m = algoPattern.exec(content)) !== null) {
      const name = m[1]
      if (knownAlgorithms.has(name)) found.add(name)
    }
  }
  return [...found].sort()
}

/** Check if module references CNSA 2.0 dates */
function usesCnsa(files: string[]): boolean {
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf-8')
    if (/CNSA[\s-]?2\.0/i.test(content)) return true
  }
  return false
}

/** Check if module references NIST deprecation dates */
function usesNistDeprecation(files: string[]): boolean {
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf-8')
    if (/deprecat.*RSA.*2030|disallow.*classical.*2035/i.test(content)) return true
  }
  return false
}

// ── Main ──────────────────────────────────────────────────────────────────

const moduleDirs = fs
  .readdirSync(MODULE_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((d) => d !== 'Quiz' && d !== 'KnowledgeGraph') // Skip non-content modules
  .sort()

let created = 0
let skipped = 0

for (const dirName of moduleDirs) {
  const moduleDir = path.join(MODULE_DIR, dirName)
  const contentPath = path.join(moduleDir, 'content.ts')

  if (fs.existsSync(contentPath) && !OVERWRITE) {
    skipped++
    continue
  }

  const moduleId =
    DIR_TO_MODULE_ID[dirName] ??
    dirName
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '')
  const files = collectFiles(moduleDir)
  if (files.length === 0) {
    skipped++
    continue
  }

  const standards = extractStandards(files)
  const algorithms = extractAlgorithms(files)
  const hasCnsa = usesCnsa(files)
  const hasNistDep = usesNistDeprecation(files)

  // Build imports
  const imports: string[] = ["import type { ModuleContent } from '@/types/ModuleContentTypes'"]
  if (hasCnsa || hasNistDep) {
    const parts: string[] = []
    if (hasCnsa) parts.push('CNSA_2_0')
    if (hasNistDep) parts.push('NIST_DEPRECATION')
    imports.push(`import { ${parts.join(', ')} } from '@/data/regulatoryTimelines'`)
  }
  if (algorithms.length > 0) {
    imports.push("import { getAlgorithm } from '@/data/algorithmProperties'")
  }
  if (standards.length > 0) {
    imports.push("import { getStandard } from '@/data/standardsRegistry'")
  }

  // Build deadlines
  const deadlines: string[] = []
  if (hasCnsa) {
    deadlines.push(
      `    { label: 'CNSA 2.0 software signing preferred', year: CNSA_2_0.softwarePreferred, source: 'CNSA 2.0' }`
    )
    deadlines.push(
      `    { label: 'CNSA 2.0 software exclusive', year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' }`
    )
  }
  if (hasNistDep) {
    deadlines.push(
      `    { label: 'NIST: deprecate RSA-2048 and 112-bit ECC', year: NIST_DEPRECATION.deprecateClassical, source: 'NIST IR 8547' }`
    )
    deadlines.push(
      `    { label: 'NIST: disallow all classical public-key crypto', year: NIST_DEPRECATION.disallowClassical, source: 'NIST IR 8547' }`
    )
  }

  const contentFile = `// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the ${dirName} module.
 * AUTO-GENERATED SKELETON — review and refine manually.
 */
${imports.join('\n')}

export const content: ModuleContent = {
  moduleId: '${moduleId}',
  lastReviewed: '2026-03-28',

  standards: [
${standards.map((s) => `    getStandard('${s}'),`).join('\n') || '    // No standard references detected — add manually if needed'}
  ],

  algorithms: [
${algorithms.map((a) => `    getAlgorithm('${a}'),`).join('\n') || '    // No algorithm references detected — add manually if needed'}
  ],

  deadlines: [
${deadlines.join(',\n') || '    // No regulatory deadlines detected — add manually if needed'}
  ],

  narratives: {
    // TODO: Extract narrative text from JSX components
  },
}
`

  if (DRY_RUN) {
    console.log(`[DRY RUN] Would create: ${path.relative(ROOT, contentPath)}`)
    console.log(
      `  Standards: ${standards.length}, Algorithms: ${algorithms.length}, CNSA: ${hasCnsa}, NIST dep: ${hasNistDep}`
    )
  } else {
    fs.writeFileSync(contentPath, contentFile)
    console.log(
      `Created: ${path.relative(ROOT, contentPath)} (${standards.length} stds, ${algorithms.length} algos)`
    )
  }
  created++
}

console.log(`\nDone: ${created} created, ${skipped} skipped (already exist or empty)`)
